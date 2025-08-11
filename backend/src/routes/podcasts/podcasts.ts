import { Router, Request, Response } from 'express'
import { Op, QueryTypes, col, fn, literal } from 'sequelize'
import { Show, Episode, PodcastPlay, Profile } from '../../models/index.js'

// NOWY CZYSTY PLIK – poprzednia uszkodzona zawartość została nadpisana.

const router = Router()

// Deterministyczne sortowanie (stabilne) dla zagregowanych rekordów
function sortAggregated<T extends { id: number; name?: string | null; playCount?: number; totalTime?: number; lastPlayed?: string | null }>(rows: T[], sortBy: string, order: string) {
  const dir = order?.toLowerCase() === 'desc' ? -1 : 1
  rows.sort((a, b) => {
    const aName = a.name || ''
    const bName = b.name || ''
    switch (sortBy) {
      case 'plays': {
        const av = a.playCount || 0; const bv = b.playCount || 0
        if (av !== bv) return (av - bv) * dir
        break
      }
      case 'time': {
        const av = a.totalTime || 0; const bv = b.totalTime || 0
        if (av !== bv) return (av - bv) * dir
        break
      }
      case 'lastPlayed': {
        const av = a.lastPlayed ? Date.parse(a.lastPlayed) : 0
        const bv = b.lastPlayed ? Date.parse(b.lastPlayed) : 0
        if (av !== bv) return (av - bv) * dir
        break
      }
      case 'name':
      default: {
        const cmp = aName.localeCompare(bName)
        if (cmp !== 0) return cmp * dir
      }
    }
    // Tie-breakers zawsze rosnąco
    const nameCmp = aName.localeCompare(bName)
    if (nameCmp !== 0) return nameCmp
    return a.id - b.id
  })
  return rows
}

const toInt = (v: any, fb: number) => { const n = parseInt(v); return Number.isNaN(n) ? fb : n }

// GET /podcasts/shows
router.get('/shows', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', search, profileId, sortBy = 'name', order = 'asc' } = req.query as any
    const limitNum = toInt(limit, 50)
    const offsetNum = toInt(offset, 0)
    
    // For aggregated stats with plays data (specific profile or all profiles)
    if (profileId) {
      const whereCondition = profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
      
      const agg = await PodcastPlay.findAll({
        attributes: [
          [col('episode.show.id'), 'id'],
          [col('episode.show.name'), 'name'],
          [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
          [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime'],
          [fn('MAX', col('PodcastPlay.timestamp')), 'lastPlayed']
        ],
        where: whereCondition,
        include: [{ model: Episode, attributes: [], include: [{ model: Show, attributes: [] }] }],
        group: ['episode.show.id', 'episode.show.name'],
        raw: true
      }) as any[]
      let rows = agg.map(r => ({
        id: r.id,
        name: r.name || 'Unknown Show',
        playCount: Number(r.playCount) || 0,
        totalTime: Number(r.totalTime) || 0,
        lastPlayed: r.lastPlayed ? new Date(r.lastPlayed).toISOString() : null
      }))
      if (search) {
        const s = String(search).toLowerCase()
        rows = rows.filter(r => (r.name || '').toLowerCase().includes(s))
      }
      sortAggregated(rows, String(sortBy), String(order))
      const total = rows.length
      return res.json({ success: true, data: { shows: rows.slice(offsetNum, offsetNum + limitNum), total, limit: limitNum, offset: offsetNum } })
    }
    
    // For no profile parameter - show all available shows without stats
    const where: any = {}
    if (search) where.name = { [Op.iLike]: `%${search}%` }
    const shows = await Show.findAndCountAll({ where, limit: limitNum, offset: offsetNum, order: [['name', 'ASC']] })
    return res.json({ success: true, data: { shows: shows.rows, total: shows.count, limit: limitNum, offset: offsetNum } })
  } catch (e) {
    console.error('Error fetching shows:', e)
    res.status(500).json({ success: false, message: 'Failed to fetch shows' })
  }
})

// GET /podcasts/shows/:showId/episodes
router.get('/shows/:showId/episodes', async (req: Request, res: Response) => {
  try {
    const { showId } = req.params
    const { limit = '50', offset = '0', profileId, search, sortBy = 'name', order = 'asc' } = req.query as any
    const limitNum = toInt(limit, 50)
    const offsetNum = toInt(offset, 0)
    
    // For aggregated plays data (specific profile or all profiles)
    if (profileId) {
      const whereCondition = profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
      
      const agg = await PodcastPlay.findAll({
        attributes: [
          [col('episode.id'), 'id'],
          [col('episode.name'), 'name'],
          [col('episode.spotifyUri'), 'spotifyUri'],
          [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
          [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime'],
          [fn('MAX', col('PodcastPlay.timestamp')), 'lastPlayed']
        ],
        where: whereCondition,
        include: [{ model: Episode, attributes: [], where: { showId: toInt(showId, 0) } }],
        group: ['episode.id', 'episode.name', 'episode.spotifyUri'],
        raw: true
      }) as any[]
      let rows = agg.map(r => ({
        id: r.id,
        name: r.name || 'Unknown Episode',
        spotifyUri: r.spotifyUri || null,
        playCount: Number(r.playCount) || 0,
        totalTime: Number(r.totalTime) || 0,
        lastPlayed: r.lastPlayed ? new Date(r.lastPlayed).toISOString() : null
      }))
      if (search) {
        const s = String(search).toLowerCase()
        rows = rows.filter(r => (r.name || '').toLowerCase().includes(s))
      }
      sortAggregated(rows, String(sortBy), String(order))
      const total = rows.length
      return res.json({ success: true, data: { episodes: rows.slice(offsetNum, offsetNum + limitNum), total, limit: limitNum, offset: offsetNum } })
    }
    
    // For no profile parameter - show all available episodes without stats
    const where: any = { showId: toInt(showId, 0) }
    if (search) where.name = { [Op.iLike]: `%${search}%` }
    const episodes = await Episode.findAndCountAll({ where, limit: limitNum, offset: offsetNum, order: [['name', 'ASC']], include: [{ model: Show, attributes: ['name'] }] })
    return res.json({ success: true, data: { episodes: episodes.rows, total: episodes.count, limit: limitNum, offset: offsetNum } })
  } catch (e) {
    console.error('Error fetching episodes:', e)
    return res.status(500).json({ success: false, message: 'Failed to fetch episodes' })
  }
})

// GET /podcasts/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter = profileId && profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
    
    if (profileId && profileId !== 'all') {
      const pid = toInt(profileId, 0)
      const profile = await Profile.findByPk(pid)
      if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    const totalPodcastPlays = await PodcastPlay.count({ where: filter })
    const totalMs = await PodcastPlay.sum('msPlayed', { where: filter }) || 0
    const uniqueEpisodes = await PodcastPlay.count({ distinct: true, col: 'episodeId', where: filter })
    
    const showQuery = profileId && profileId !== 'all' 
      ? `SELECT COUNT(DISTINCT e."showId") as count
         FROM podcast_plays p
         INNER JOIN episodes e ON p."episodeId" = e.id
         WHERE p."profileId" = :pid`
      : `SELECT COUNT(DISTINCT e."showId") as count
         FROM podcast_plays p
         INNER JOIN episodes e ON p."episodeId" = e.id`
    
    const showRows = await PodcastPlay.sequelize!.query(showQuery, { 
      replacements: profileId && profileId !== 'all' ? { pid: toInt(profileId, 0) } : {}, 
      type: QueryTypes.SELECT 
    }) as any[]
    
    const uniqueShows = showRows[0]?.count || 0
    res.json({ success: true, data: { totalPodcastPlays, totalPodcastMinutes: Math.round(totalMs / 60000), uniqueEpisodes, uniqueShows } })
  } catch (e) {
    console.error('Error fetching podcast stats:', e)
    res.json({ success: true, data: { totalPodcastPlays: 0, totalPodcastMinutes: 0, uniqueEpisodes: 0, uniqueShows: 0 } })
  }
})

// GET /podcasts/top-shows
router.get('/top-shows', async (req: Request, res: Response) => {
  try {
    const { profileId, limit = '10' } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter = profileId && profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
    
    if (profileId && profileId !== 'all') {
      const pid = toInt(profileId, 0)
      const profile = await Profile.findByPk(pid)
      if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    const rows = await PodcastPlay.findAll({
      attributes: [
        [col('episode.show.id'), 'showId'],
        [col('episode.show.name'), 'showName'],
        [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
        [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime']
      ],
      where: filter,
      include: [{ model: Episode, attributes: [], include: [{ model: Show, attributes: [] }] }],
      group: ['episode.show.id', 'episode.show.name'],
      raw: true
    }) as any[]
    const formatted = rows.map(r => ({
      id: r.showId,
      name: r.showName || 'Unknown Show',
      playCount: Number(r.playCount) || 0,
      totalTime: Number(r.totalTime) || 0
    })).sort((a, b) => b.playCount - a.playCount).slice(0, toInt(limit, 10))
    res.json({ success: true, data: formatted })
  } catch (e) {
    console.error('Error fetching top shows:', e)
    res.json({ success: true, data: [] })
  }
})

// GET /podcasts/top-episodes
router.get('/top-episodes', async (req: Request, res: Response) => {
  try {
    const { profileId, limit = '20' } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter = profileId && profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
    
    if (profileId && profileId !== 'all') {
      const pid = toInt(profileId, 0)
      const profile = await Profile.findByPk(pid)
      if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' })
    }
    
    const rows = await PodcastPlay.findAll({
      attributes: [
        [col('episode.id'), 'episodeId'],
        [col('episode.name'), 'episodeName'],
        [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
        [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime']
      ],
      where: filter,
      include: [{ model: Episode, attributes: [] }],
      group: ['episode.id', 'episode.name'],
      raw: true
    }) as any[]
    const formatted = rows.map(r => ({
      id: r.episodeId,
      name: r.episodeName || 'Unknown Episode',
      playCount: Number(r.playCount) || 0,
      totalTime: Number(r.totalTime) || 0
    })).sort((a, b) => b.playCount - a.playCount).slice(0, toInt(limit, 20))
    res.json({ success: true, data: formatted })
  } catch (e) {
    console.error('Error fetching top episodes:', e)
    res.json({ success: true, data: [] })
  }
})

// GET /podcasts/daily-stats
router.get('/daily-stats', async (req: Request, res: Response) => {
  try {
    const { profileId, days = '30' } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter: any = { timestamp: { [Op.gte]: (() => {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - toInt(days, 30))
      return startDate
    })() } }
    
    if (profileId && profileId !== 'all') {
      filter.profileId = toInt(profileId, 0)
    }
    
    const rows = await PodcastPlay.findAll({
      attributes: [
        [fn('DATE', col('timestamp')), 'date'],
        [fn('COUNT', col('id')), 'plays'],
        [fn('SUM', col('msPlayed')), 'totalMs']
      ],
      where: filter,
      group: [fn('DATE', col('timestamp')) as any],
      order: [[fn('DATE', col('timestamp')), 'ASC']],
      raw: true
    }) as any[]
    const data = rows.map(r => ({
      date: r.date,
      plays: Number(r.plays) || 0,
      totalMs: Number(r.totalMs) || 0,
      minutes: (Number(r.totalMs) || 0) / 60000
    }))
    res.json({ success: true, data })
  } catch (e) {
    console.error('Error fetching daily stats:', e)
    res.json({ success: true, data: [] })
  }
})

// GET /podcasts/daily-stats-all  (pełny zakres bez parametru days)
router.get('/daily-stats-all', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter = profileId && profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
    
    const rows = await PodcastPlay.findAll({
      attributes: [
        [fn('DATE', col('timestamp')), 'date'],
        [fn('COUNT', col('id')), 'plays'],
        [fn('SUM', col('msPlayed')), 'totalMs']
      ],
      where: filter,
      group: [fn('DATE', col('timestamp')) as any],
      order: [[fn('DATE', col('timestamp')), 'ASC']],
      raw: true
    }) as any[]
    const data = rows.map(r => ({
      date: r.date,
      plays: Number(r.plays) || 0,
      totalMs: Number(r.totalMs) || 0,
      minutes: (Number(r.totalMs) || 0) / 60000
    }))
    res.json({ success: true, data })
  } catch (e) {
    console.error('Error fetching daily stats all:', e)
    res.json({ success: true, data: [] })
  }
})

// GET /podcasts/platform-stats
router.get('/platform-stats', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query as any
    if (!profileId) return res.status(400).json({ success: false, message: 'Profile ID is required' })
    const pid = toInt(profileId, 0)
    const rows = await PodcastPlay.findAll({
      attributes: ['platform', [fn('COUNT', col('id')), 'plays']],
      where: { profileId: pid },
      group: ['platform'],
      raw: true
    }) as any[]
    const total = rows.reduce((s, r) => s + Number(r.plays || 0), 0) || 1
    const data = rows.map(r => ({
      platform: r.platform || 'Unknown',
      plays: Number(r.plays) || 0,
      percentage: Math.round(((Number(r.plays) || 0) / total) * 100)
    })).sort((a, b) => b.plays - a.plays)
    res.json({ success: true, data })
  } catch (e) {
    console.error('Error fetching platform stats:', e)
    res.json({ success: true, data: [] })
  }
})

// GET /podcasts/time-of-day
router.get('/time-of-day', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter = profileId && profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
    
    const rows = await PodcastPlay.findAll({
      attributes: [
        [literal('EXTRACT(HOUR FROM "timestamp")::int'), 'hour'],
        [fn('COUNT', col('id')), 'plays'],
        [fn('SUM', col('msPlayed')), 'totalMs']
      ],
      where: filter,
      group: [literal('EXTRACT(HOUR FROM "timestamp")::int') as any],
      raw: true
    }) as any[]
    const data = rows.map(r => ({
      hour: Number(r.hour) || 0,
      plays: Number(r.plays) || 0,
      totalMs: Number(r.totalMs) || 0,
      minutes: (Number(r.totalMs) || 0) / 60000
    })).sort((a, b) => a.hour - b.hour)
    res.json({ success: true, data })
  } catch (e) {
    console.error('Error fetching time-of-day stats:', e)
    res.json({ success: true, data: [] })
  }
})

// GET /podcasts/day-of-week
router.get('/day-of-week', async (req: Request, res: Response) => {
  try {
    const { profileId } = req.query as any
    
    // Jeśli profileId nie jest podane lub === 'all', agreguj wszystkie profile
    const filter = profileId && profileId !== 'all' ? { profileId: toInt(profileId, 0) } : {}
    
    const rows = await PodcastPlay.findAll({
      attributes: [
        [literal('EXTRACT(DOW FROM "timestamp")::int'), 'dow'],
        [fn('COUNT', col('id')), 'plays'],
        [fn('SUM', col('msPlayed')), 'totalMs']
      ],
      where: filter,
      group: [literal('EXTRACT(DOW FROM "timestamp")::int') as any],
      raw: true
    }) as any[]
    const data = rows.map(r => ({
      dow: Number(r.dow) || 0,
      plays: Number(r.plays) || 0,
      totalMs: Number(r.totalMs) || 0,
      minutes: (Number(r.totalMs) || 0) / 60000
    })).sort((a, b) => a.dow - b.dow)
    res.json({ success: true, data })
  } catch (e) {
    console.error('Error fetching day-of-week stats:', e)
    res.json({ success: true, data: [] })
  }
})

// Get podcast plays for a specific episode and profile
router.get('/:profileId/episode/:episodeId/plays', async (req: Request, res: Response) => {
    try {
        const { profileId, episodeId } = req.params
        const { page = 1, limit = 50 } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const offset = (pageNum - 1) * limitNum

        const plays = await PodcastPlay.findAndCountAll({
            where: {
                profileId: parseInt(profileId),
                episodeId: parseInt(episodeId)
            },
            include: [{
                model: Episode,
                attributes: ['name']
            }],
            limit: limitNum,
            offset,
            order: [['timestamp', 'DESC']]
        })

        res.json({
            success: true,
            data: {
                plays: plays.rows.map(play => ({
                    ...play.toJSON(),
                    msPlayed: parseInt(play.msPlayed as any) || 0
                })),
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(plays.count / limitNum),
                    total: plays.count
                }
            }
        })
    } catch (error) {
        console.error('Error fetching episode plays:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch episode plays'
        })
    }
})

export default router
