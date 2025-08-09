import { Router, Request, Response } from 'express'
import { Op, QueryTypes } from 'sequelize'
import { Show, Episode, PodcastPlay, Profile } from '../../models/index.js'
import sequelizePkg from 'sequelize'
const { fn, col, literal } = sequelizePkg

const router = Router()

/**
 * Pobierz listę programów/podcastów
 */
router.get('/shows', async (req: Request, res: Response) => {
    try {
        const { limit = 50, offset = 0, search, profileId, sortBy = 'name', order = 'asc' } = req.query as any

        // Jeśli podano profileId, zwróć tylko programy słuchane przez profil wraz z agregatami
        if (profileId) {
            const replacements: any = {
                profileId: parseInt(profileId),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }

            if (search) {
                replacements.search = `%${search}%`
            }

            // Sortowanie po plays|time|lastPlayed|name (po agregacji używamy aliasów; camelCase muszą być w cudzysłowach)
            const sortColumn = (
                sortBy === 'plays' ? '"playCount"' :
                sortBy === 'time' ? '"totalTime"' :
                sortBy === 'lastPlayed' ? '"lastPlayed"' : 'name'
            )
            const sortDirection = (order && String(order).toLowerCase() === 'desc') ? 'DESC' : 'ASC'

            // ORM agregacja
            const whereProfile: any = { profileId: parseInt(profileId) }
            const include = [{
                model: Episode,
                attributes: [],
                include: [{ model: Show, attributes: [] }]
            }]

            // build having search condition via show name (since include hidden, use raw whereSearch part with literal if needed)
            // search filtrowany później w JS

            const showAgg = await PodcastPlay.findAll({
                attributes: [
                    [col('episode.show.id'), 'id'],
                    [col('episode.show.name'), 'name'],
                    [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
                    [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime'],
                    [fn('MAX', col('PodcastPlay.timestamp')), 'lastPlayed']
                ],
                where: whereProfile,
                include,
                group: ['episode.show.id', 'episode.show.name'],
                raw: true
            }) as any[]

            // sort in JS based on requested column
            const sorter = (a: any, b: any) => {
                const dir = sortDirection === 'DESC' ? -1 : 1
                const aval = a[sortColumn.replace(/"/g,'')] ?? a.name
                const bval = b[sortColumn.replace(/"/g,'')] ?? b.name
                if (aval < bval) return -1 * dir
                if (aval > bval) return 1 * dir
                return 0
            }
            const sorted = showAgg.sort(sorter)
            const paged = sorted.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
            const safeRows = paged.map(r => ({
                id: r.id,
                name: r.name || 'Unknown Show',
                playCount: Number(r.playCount) || 0,
                totalTime: Number(r.totalTime) || 0,
                lastPlayed: r.lastPlayed ? new Date(r.lastPlayed).toISOString() : null
            }))
            const total = showAgg.length
            return res.json({ success: true, data: { shows: safeRows, total, limit: parseInt(limit), offset: parseInt(offset) } })
        }

        // Domyślne: wszystkie programy (bez agregacji)
        const whereClause: any = {}
        if (search) {
            whereClause.name = { [Op.iLike]: `%${search}%` }
        }
        const shows = await Show.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['name', 'ASC']]
        })
        res.json({
            success: true,
            data: {
                shows: shows.rows,
                total: shows.count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        })
    } catch (error) {
        console.error('Error fetching shows:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shows'
        })
    }
})

/**
 * Pobierz odcinki dla konkretnego programu
 */
router.get('/shows/:showId/episodes', async (req: Request, res: Response) => {
    try {
        const { showId } = req.params
        const { limit = 50, offset = 0, profileId, search, sortBy = 'name', order = 'asc' } = req.query as any

        // Jeśli podano profileId, zwracamy wyłącznie odsłuchane odcinki z agregatami
        if (profileId) {
            const replacements: any = {
                showId: parseInt(showId),
                profileId: parseInt(profileId),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
            if (search) {
                replacements.search = `%${search}%`
            }
            const sortColumn = (
                sortBy === 'plays' ? '"playCount"' :
                sortBy === 'time' ? '"totalTime"' :
                sortBy === 'lastPlayed' ? '"lastPlayed"' : 'name'
            )
            const sortDirection = (order && String(order).toLowerCase() === 'desc') ? 'DESC' : 'ASC'

            const whereProfile: any = { profileId: parseInt(profileId) }
            const episodeAgg = await PodcastPlay.findAll({
                attributes: [
                    [col('episode.id'), 'id'],
                    [col('episode.name'), 'name'],
                    [col('episode.spotifyUri'), 'spotifyUri'],
                    [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
                    [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime'],
                    [fn('MAX', col('PodcastPlay.timestamp')), 'lastPlayed']
                ],
                where: whereProfile,
                include: [{ model: Episode, attributes: [], where: { showId: parseInt(showId) } }],
                group: ['episode.id', 'episode.name', 'episode.spotifyUri'],
                raw: true
            }) as any[]
            // search filter in memory for name
            const filtered = search ? episodeAgg.filter(e => (e.name||'').toLowerCase().includes(String(search).toLowerCase())) : episodeAgg
            const dir = sortDirection === 'DESC' ? -1 : 1
            const keyMap: any = { '"playCount"':'playCount','"totalTime"':'totalTime','"lastPlayed"':'lastPlayed' }
            const sortKey = keyMap[sortColumn] || 'name'
            filtered.sort((a,b)=>{const av=a[sortKey]; const bv=b[sortKey]; if(av<bv) return -1*dir; if(av>bv) return 1*dir; return 0})
            const paged = filtered.slice(parseInt(offset), parseInt(offset)+parseInt(limit))
            const safeRows = paged.map(r=>({
                id: r.id,
                name: r.name || 'Unknown Episode',
                spotifyUri: r.spotifyUri || null,
                playCount: Number(r.playCount)||0,
                totalTime: Number(r.totalTime)||0,
                lastPlayed: r.lastPlayed ? new Date(r.lastPlayed).toISOString() : null
            }))
            return res.json({ success:true, data: { episodes: safeRows, total: filtered.length, limit: parseInt(limit), offset: parseInt(offset) } })
        }

        // Domyślne: lista odcinków programu (bez agregatów)
        const episodes = await Episode.findAndCountAll({
            where: { showId: parseInt(showId) },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['name', 'ASC']],
            include: [{
                model: Show,
                attributes: ['name']
            }]
        })
        res.json({
            success: true,
            data: {
                episodes: episodes.rows,
                total: episodes.count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        })
    } catch (error) {
        console.error('Error fetching episodes:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch episodes'
        })
    }
})

/**
 * Pobierz statystyki podcastów dla profilu
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const { profileId } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required'
            })
        }

        // Sprawdź czy profil istnieje
        const profile = await Profile.findByPk(parseInt(profileId as string))
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            })
        }

        // Debug: sprawdź wszystkie podcast_plays
        const allPodcastPlays = await PodcastPlay.findAll({
            limit: 5
        })
        console.log('🔍 All podcast plays (first 5):', allPodcastPlays.map(p => ({
            id: p.id,
            profileId: p.profileId,
            episodeId: p.episodeId,
            msPlayed: p.msPlayed
        })))

        // Podstawowe statystyki podcastów
        const totalPodcastPlays = await PodcastPlay.count({
            where: { profileId }
        }) || 0

        console.log('🔍 Total podcast plays for profile', profileId, ':', totalPodcastPlays)

        const totalPodcastTimeResult = await PodcastPlay.sum('msPlayed', {
            where: { profileId }
        })
        const totalPodcastMinutes = Math.round((totalPodcastTimeResult || 0) / 60000)

        const uniqueEpisodes = await PodcastPlay.count({
            distinct: true,
            col: 'episodeId',
            where: { profileId }
        }) || 0

        // Policzyć unikalne shows poprzez proste zapytanie SQL
        const uniqueShows = await PodcastPlay.sequelize!.query(`
            SELECT COUNT(DISTINCT e."showId") as count
            FROM podcast_plays p
            INNER JOIN episodes e ON p."episodeId" = e.id
            WHERE p."profileId" = :profileId
        `, {
            replacements: { profileId },
            type: QueryTypes.SELECT
        }) as any[]
        
        const uniqueShowsCount = uniqueShows[0]?.count || 0

        res.json({
            success: true,
            data: {
                totalPodcastPlays,
                totalPodcastMinutes,
                uniqueShows: uniqueShowsCount,
                uniqueEpisodes
            }
        })
    } catch (error) {
        console.error('Error fetching podcast stats:', error)
        res.json({
            success: true,
            data: {
                totalPodcastPlays: 0,
                totalPodcastMinutes: 0,
                uniqueShows: 0,
                uniqueEpisodes: 0
            }
        })
    }
})

/**
 * Pobierz najpopularniejsze podcasty
 */
router.get('/top-shows', async (req: Request, res: Response) => {
    try {
        const { profileId, limit = 10 } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required'
            })
        }

        // Zapytanie SQL do pobrania top podcastów
        const topShowsRaw = await PodcastPlay.findAll({
            attributes: [
                [col('episode.show.id'), 'showId'],
                [col('episode.show.name'), 'showName'],
                [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
                [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime']
            ],
            where: { profileId: parseInt(profileId as string) },
            include: [{ model: Episode, attributes: [], include: [{ model: Show, attributes: [] }] }],
            group: ['episode.show.id','episode.show.name'],
            raw: true
        }) as any[]
        const formattedShows = topShowsRaw.map(r=>({
            id: `show-${r.showId}`,
            name: r.showName || 'Unknown Show',
            playCount: Number(r.playCount)||0,
            totalTime: Number(r.totalTime)||0,
            publisher: null
        })).sort((a,b)=> b.playCount - a.playCount).slice(0, parseInt(limit as string))

        res.json({
            success: true,
            data: formattedShows
        })
    } catch (error) {
        console.error('Error fetching top shows:', error)
        res.json({
            success: true,
            data: []
        })
    }
})

/**
 * Pobierz najpopularniejsze odcinki
 */
router.get('/top-episodes', async (req: Request, res: Response) => {
    try {
        const { profileId, limit = 20 } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required'
            })
        }

        const topEpisodesRaw = await PodcastPlay.findAll({
            attributes: [
                [col('episode.id'), 'episodeId'],
                [col('episode.name'), 'episodeName'],
                [col('episode.show.name'), 'showName'],
                [fn('COUNT', col('PodcastPlay.id')), 'playCount'],
                [fn('SUM', col('PodcastPlay.msPlayed')), 'totalTime']
            ],
            where: { profileId: parseInt(profileId as string) },
            include: [{ model: Episode, attributes: [], include: [{ model: Show, attributes: [] }] }],
            group: ['episode.id','episode.name','episode.show.name'],
            raw: true
        }) as any[]
        const formattedEpisodes = topEpisodesRaw.map(r=>({
            id: `episode-${r.episodeId}`,
            name: r.episodeName || 'Unknown Episode',
            showName: r.showName || 'Unknown Show',
            playCount: Number(r.playCount)||0,
            totalTime: Number(r.totalTime)||0
        })).sort((a,b)=> b.playCount - a.playCount).slice(0, parseInt(limit as string))

        res.json({
            success: true,
            data: formattedEpisodes
        })
    } catch (error) {
        console.error('Error fetching top episodes:', error)
        res.json({
            success: true,
            data: []
        })
    }
})

/**
 * Pobierz ostatnio odtwarzane podcasty
 */
router.get('/recent-plays', async (req: Request, res: Response) => {
    try {
        const { profileId, limit = 50 } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required'
            })
        }

        const recentPlays = await PodcastPlay.findAll({
            include: [{
                model: Episode,
                attributes: ['name'],
                include: [{
                    model: Show,
                    attributes: ['name']
                }]
            }],
            where: { profileId },
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit as string)
        })

        res.json({
            success: true,
            data: recentPlays
        })
    } catch (error) {
        console.error('Error fetching recent plays:', error)
        res.json({
            success: true,
            data: []
        })
    }
})

/**
 * Pobierz statystyki dzienne
 */
router.get('/daily-stats', async (req: Request, res: Response) => {
    try {
        const { profileId, days = 30 } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required'
            })
        }

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(days as string))

        const dailyStats = await PodcastPlay.findAll({
            attributes: [
                [fn('DATE', col('timestamp')), 'date'],
                [fn('COUNT', col('id')), 'plays'],
                [fn('SUM', col('msPlayed')), 'totalMs']
            ],
            where: { profileId, timestamp: { [Op.gte]: startDate } },
            group: [fn('DATE', col('timestamp'))],
            order: [[fn('DATE', col('timestamp')), 'ASC']],
            raw: true
        }) as any[]

        const formattedStats = dailyStats.map((stat: any) => {
            const totalMs = Number(stat.totalMs) || parseInt(stat.totalMs) || 0
            return {
                date: stat.date,
                plays: parseInt(stat.plays),
                minutes: Number((totalMs / 60000).toFixed(1))
            }
        })

        res.json({
            success: true,
            data: formattedStats
        })
    } catch (error) {
        console.error('Error fetching daily stats:', error)
        res.json({
            success: true,
            data: []
        })
    }
})

/**
 * Pobierz statystyki platform
 */
router.get('/platform-stats', async (req: Request, res: Response) => {
    try {
        const { profileId } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                message: 'Profile ID is required'
            })
        }

        const platformStats = await PodcastPlay.findAll({
            attributes: [
                'platform',
                [PodcastPlay.sequelize!.fn('COUNT', '*'), 'plays']
            ],
            where: { profileId },
            group: ['platform'],
            order: [[PodcastPlay.sequelize!.literal('COUNT(*)'), 'DESC']],
            raw: true
        })

        const totalPlays = platformStats.reduce((sum: number, stat: any) => sum + parseInt(stat.plays), 0)

        const formattedStats = platformStats.map((stat: any) => ({
            platform: stat.platform || 'Unknown',
            plays: parseInt(stat.plays),
            percentage: Math.round((parseInt(stat.plays) / totalPlays) * 100)
        }))

        res.json({
            success: true,
            data: formattedStats
        })
    } catch (error) {
        console.error('Error fetching platform stats:', error)
        res.json({
            success: true,
            data: []
        })
    }
})

export default router

/**
 * Dodatkowe statystyki: rozkład w ciągu dnia (godzina) oraz dni tygodnia
 */
router.get('/time-of-day', async (req: Request, res: Response) => {
    try {
        const { profileId } = req.query as any
        if (!profileId) {
            return res.status(400).json({ success: false, message: 'Profile ID is required' })
        }

        const rows = await PodcastPlay.findAll({
            attributes: [
                [literal('EXTRACT(HOUR FROM "timestamp")::int'), 'hour'],
                [fn('COUNT', col('id')), 'plays'],
                [fn('SUM', col('msPlayed')), 'totalMs']
            ],
            where: { profileId: parseInt(profileId) },
            group: [col('hour')],
            raw: true
        }) as any[]
        const data = rows.map(r=> ({
            hour: Number(r.hour)||0,
            plays: Number(r.plays)||0,
            totalMs: Number(r.totalMs)||0,
            minutes: (Number(r.totalMs)||0)/60000
        })).sort((a,b)=> a.hour-b.hour)

        res.json({ success: true, data })
    } catch (error) {
        console.error('Error fetching time-of-day stats:', error)
        res.json({ success: true, data: [] })
    }
})

router.get('/day-of-week', async (req: Request, res: Response) => {
    try {
        const { profileId } = req.query as any
        if (!profileId) {
            return res.status(400).json({ success: false, message: 'Profile ID is required' })
        }

        const rows = await PodcastPlay.findAll({
            attributes: [
                [literal('EXTRACT(DOW FROM "timestamp")::int'), 'dow'],
                [fn('COUNT', col('id')), 'plays'],
                [fn('SUM', col('msPlayed')), 'totalMs']
            ],
            where: { profileId: parseInt(profileId) },
            group: [col('dow')],
            raw: true
        }) as any[]
        const data = rows.map(r=> ({
            dow: Number(r.dow)||0,
            plays: Number(r.plays)||0,
            totalMs: Number(r.totalMs)||0,
            minutes: (Number(r.totalMs)||0)/60000
        })).sort((a,b)=> a.dow-b.dow)

        res.json({ success: true, data })
    } catch (error) {
        console.error('Error fetching day-of-week stats:', error)
        res.json({ success: true, data: [] })
    }
})

/**
 * DEBUG: surowe sumy msPlayed dla szybkiej diagnostyki (tymczasowe)
 */
