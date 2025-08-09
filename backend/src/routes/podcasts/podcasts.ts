import { Router, Request, Response } from 'express'
import { Op, QueryTypes } from 'sequelize'
import { Show, Episode, PodcastPlay, Profile } from '../../models/index.js'

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

            let whereSearch = ''
            if (search) {
                whereSearch = 'AND s.name ILIKE :search'
                replacements.search = `%${search}%`
            }

            // Sortowanie po plays|time|lastPlayed|name (po agregacji używamy aliasów; camelCase muszą być w cudzysłowach)
            const sortColumn = (
                sortBy === 'plays' ? '"playCount"' :
                sortBy === 'time' ? '"totalTime"' :
                sortBy === 'lastPlayed' ? '"lastPlayed"' : 'name'
            )
            const sortDirection = (order && String(order).toLowerCase() === 'desc') ? 'DESC' : 'ASC'

            const rows = await PodcastPlay.sequelize!.query(`
                SELECT * FROM (
                    SELECT 
                        s.id as id,
                        s.name as name,
                        COUNT(*)::int as "playCount",
                        COALESCE(SUM(p."msPlayed"),0)::bigint as "totalTime",
                        MAX(p."timestamp") as "lastPlayed"
                    FROM podcast_plays p
                    INNER JOIN episodes e ON p."episodeId" = e.id
                    INNER JOIN shows s ON e."showId" = s.id
                    WHERE p."profileId" = :profileId
                    ${whereSearch}
                    GROUP BY s.id, s.name
                ) as agg
                ORDER BY ${sortColumn} ${sortDirection}
                LIMIT :limit OFFSET :offset
            `, { replacements, type: QueryTypes.SELECT }) as any[]

            // Bezpieczne rzutowanie wartości do JSON (unikamy BigInt w odpowiedzi)
            const safeRows = rows.map((r: any) => ({
                id: r.id,
                name: r.name || 'Unknown Show',
                playCount: typeof r.playCount === 'string' ? parseInt(r.playCount, 10) : Number(r.playCount) || 0,
                totalTime: typeof r.totalTime === 'string' ? parseInt(r.totalTime, 10) : Number(r.totalTime) || 0,
                lastPlayed: r.lastPlayed ? new Date(r.lastPlayed).toISOString() : null
            }))

            const countRows = await PodcastPlay.sequelize!.query(`
                SELECT COUNT(*) as cnt FROM (
                    SELECT s.id
                    FROM podcast_plays p
                    INNER JOIN episodes e ON p."episodeId" = e.id
                    INNER JOIN shows s ON e."showId" = s.id
                    WHERE p."profileId" = :profileId
                    ${whereSearch}
                    GROUP BY s.id
                ) x
            `, { replacements, type: QueryTypes.SELECT }) as any[]

            const totalRaw = (countRows[0] as any)?.cnt
            const total = typeof totalRaw === 'string' ? parseInt(totalRaw, 10) : Number(totalRaw) || 0

        return res.json({
                success: true,
                data: {
            shows: safeRows,
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            })
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
            let whereSearch = ''
            if (search) {
                whereSearch = 'AND e.name ILIKE :search'
                replacements.search = `%${search}%`
            }
            const sortColumn = (
                sortBy === 'plays' ? '"playCount"' :
                sortBy === 'time' ? '"totalTime"' :
                sortBy === 'lastPlayed' ? '"lastPlayed"' : 'name'
            )
            const sortDirection = (order && String(order).toLowerCase() === 'desc') ? 'DESC' : 'ASC'

            const rows = await PodcastPlay.sequelize!.query(`
                SELECT 
                    e.id as id,
                    e.name as name,
                    e."spotifyUri" as "spotifyUri",
                    COUNT(*)::int as "playCount",
                    COALESCE(SUM(p."msPlayed"),0)::bigint as "totalTime",
                    MAX(p."timestamp") as "lastPlayed"
                FROM podcast_plays p
                INNER JOIN episodes e ON p."episodeId" = e.id
                WHERE e."showId" = :showId AND p."profileId" = :profileId
                ${whereSearch}
                GROUP BY e.id, e.name, e."spotifyUri"
                ORDER BY ${sortColumn} ${sortDirection}
                LIMIT :limit OFFSET :offset
            `, { replacements, type: QueryTypes.SELECT }) as any[]

            const safeRows = rows.map((r: any) => ({
                id: r.id,
                name: r.name || 'Unknown Episode',
                spotifyUri: r.spotifyUri || null,
                playCount: typeof r.playCount === 'string' ? parseInt(r.playCount, 10) : Number(r.playCount) || 0,
                totalTime: typeof r.totalTime === 'string' ? parseInt(r.totalTime, 10) : Number(r.totalTime) || 0,
                lastPlayed: r.lastPlayed ? new Date(r.lastPlayed).toISOString() : null
            }))

            const countRows = await PodcastPlay.sequelize!.query(`
                SELECT COUNT(*) as cnt FROM (
                    SELECT e.id
                    FROM podcast_plays p
                    INNER JOIN episodes e ON p."episodeId" = e.id
                    WHERE e."showId" = :showId AND p."profileId" = :profileId
                    ${whereSearch}
                    GROUP BY e.id
                ) x
            `, { replacements, type: QueryTypes.SELECT }) as any[]
            const total = parseInt(countRows[0]?.cnt || '0')

        return res.json({
                success: true,
                data: {
            episodes: safeRows,
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            })
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
        const topShows = await PodcastPlay.sequelize!.query(`
            SELECT 
                s.id as "showId",
                s.name as "showName",
                COUNT(*) as "playCount",
                SUM(p."msPlayed") as "totalTime"
            FROM podcast_plays p
            INNER JOIN episodes e ON p."episodeId" = e.id
            INNER JOIN shows s ON e."showId" = s.id
            WHERE p."profileId" = :profileId
            GROUP BY s.id, s.name
            ORDER BY COUNT(*) DESC
            LIMIT :limit
        `, {
            replacements: { 
                profileId: profileId,
                limit: parseInt(limit as string)
            },
            type: QueryTypes.SELECT
        }) as any[]

        const formattedShows = topShows.map((result: any) => ({
            id: `show-${result.showId}`,
            name: result.showName || 'Unknown Show',
            playCount: parseInt(result.playCount) || 0,
            totalTime: parseInt(result.totalTime) || 0,
            publisher: null
        }))

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

        const topEpisodes = await PodcastPlay.sequelize!.query(`
            SELECT 
                e.id as "episodeId",
                e.name as "episodeName",
                s.name as "showName",
                COUNT(*) as "playCount",
                SUM(p."msPlayed") as "totalTime"
            FROM podcast_plays p
            INNER JOIN episodes e ON p."episodeId" = e.id
            INNER JOIN shows s ON e."showId" = s.id
            WHERE p."profileId" = :profileId
            GROUP BY e.id, e.name, s.name
            ORDER BY COUNT(*) DESC
            LIMIT :limit
        `, {
            replacements: { 
                profileId: profileId,
                limit: parseInt(limit as string)
            },
            type: QueryTypes.SELECT
        }) as any[]

        const formattedEpisodes = topEpisodes.map((result: any) => ({
            id: `episode-${result.episodeId}`,
            name: result.episodeName || 'Unknown Episode',
            showName: result.showName || 'Unknown Show',
            playCount: parseInt(result.playCount) || 0,
            totalTime: parseInt(result.totalTime) || 0
        }))

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
                [PodcastPlay.sequelize!.fn('DATE', PodcastPlay.sequelize!.col('timestamp')), 'date'],
                [PodcastPlay.sequelize!.fn('COUNT', '*'), 'plays'],
                [PodcastPlay.sequelize!.fn('SUM', PodcastPlay.sequelize!.col('msPlayed')), 'totalMs']
            ],
            where: {
                profileId,
                timestamp: {
                    [Op.gte]: startDate
                }
            },
            group: [PodcastPlay.sequelize!.fn('DATE', PodcastPlay.sequelize!.col('timestamp'))],
            order: [[PodcastPlay.sequelize!.fn('DATE', PodcastPlay.sequelize!.col('timestamp')), 'ASC']],
            raw: true
        })

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

        const rows = await PodcastPlay.sequelize!.query(`
            SELECT 
                EXTRACT(HOUR FROM p."timestamp")::int AS hour,
                COUNT(*)::int AS plays,
                COALESCE(SUM(p."msPlayed"),0)::bigint AS totalMs
            FROM podcast_plays p
            WHERE p."profileId" = :profileId
            GROUP BY EXTRACT(HOUR FROM p."timestamp")
            ORDER BY hour ASC
        `, { replacements: { profileId: parseInt(profileId) }, type: QueryTypes.SELECT }) as any[]

        const data = rows.map((r: any) => {
            const totalMs = (typeof r.totalMs === 'string' ? parseInt(r.totalMs, 10) : Number(r.totalMs) || 0)
            const minutes = totalMs / 60000
            return {
                hour: typeof r.hour === 'string' ? parseInt(r.hour, 10) : Number(r.hour) || 0,
                plays: typeof r.plays === 'string' ? parseInt(r.plays, 10) : Number(r.plays) || 0,
                totalMs,
                minutes
            }
        })

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

        const rows = await PodcastPlay.sequelize!.query(`
            SELECT 
                EXTRACT(DOW FROM p."timestamp")::int AS dow,
                COUNT(*)::int AS plays,
                COALESCE(SUM(p."msPlayed"),0)::bigint AS totalMs
            FROM podcast_plays p
            WHERE p."profileId" = :profileId
            GROUP BY EXTRACT(DOW FROM p."timestamp")
            ORDER BY dow ASC
        `, { replacements: { profileId: parseInt(profileId) }, type: QueryTypes.SELECT }) as any[]

        const data = rows.map((r: any) => {
            const totalMs = (typeof r.totalMs === 'string' ? parseInt(r.totalMs, 10) : Number(r.totalMs) || 0)
            const minutes = totalMs / 60000
            return {
                dow: typeof r.dow === 'string' ? parseInt(r.dow, 10) : Number(r.dow) || 0,
                plays: typeof r.plays === 'string' ? parseInt(r.plays, 10) : Number(r.plays) || 0,
                totalMs,
                minutes
            }
        })

        res.json({ success: true, data })
    } catch (error) {
        console.error('Error fetching day-of-week stats:', error)
        res.json({ success: true, data: [] })
    }
})

/**
 * DEBUG: surowe sumy msPlayed dla szybkiej diagnostyki (tymczasowe)
 */
router.get('/debug/ms', async (req: Request, res: Response) => {
    try {
        const { profileId } = req.query as any
        if (!profileId) {
            return res.status(400).json({ success: false, message: 'Profile ID is required' })
        }

                const pid = parseInt(profileId)

                // Prosta suma i avg po cytowanej kolumnie (jedyny wariant)
                const [agg] = await PodcastPlay.sequelize!.query(`
                        SELECT 
                            COUNT(*)::int AS plays,
                            COALESCE(SUM(p."msPlayed"),0)::bigint AS totalMs,
                            COALESCE(AVG(p."msPlayed"),0)::bigint AS avgMs
                        FROM podcast_plays p WHERE p."profileId" = :pid
                `, { replacements: { pid }, type: QueryTypes.SELECT }) as any[]

                // ORM sum dla porównania
                const ormSum = await PodcastPlay.sum('msPlayed', { where: { profileId: pid } }) as any

                // Ręczny select kilku msPlayed bez agregacji via raw
                const rawRows = await PodcastPlay.sequelize!.query(`
                        SELECT id, "profileId", "msPlayed", "timestamp" FROM podcast_plays
                        WHERE "profileId" = :pid ORDER BY id DESC LIMIT 5
                `, { replacements: { pid }, type: QueryTypes.SELECT }) as any[]

        // Próbka rekordów
        const samples = await PodcastPlay.findAll({
            where: { profileId: pid },
            order: [['timestamp','DESC']],
            limit: 10,
            attributes: ['id','episodeId','msPlayed','timestamp']
        })

        // Top godziny z ms > 0
        const hours = await PodcastPlay.sequelize!.query(`
            SELECT EXTRACT(HOUR FROM "timestamp")::int AS hour, COUNT(*)::int AS plays, COALESCE(SUM("msPlayed"),0)::bigint AS totalMs
            FROM podcast_plays WHERE "profileId" = :pid GROUP BY 1 ORDER BY hour
        `, { replacements: { pid }, type: QueryTypes.SELECT })

        // Top odcinki (pierwsze 5) z sumą ms
        const topEpisodes = await PodcastPlay.sequelize!.query(`
            SELECT e.name, SUM(p."msPlayed")::bigint AS totalMs, COUNT(*)::int AS plays
            FROM podcast_plays p INNER JOIN episodes e ON p."episodeId" = e.id
            WHERE p."profileId" = :pid
            GROUP BY e.name ORDER BY totalMs DESC LIMIT 5
        `, { replacements: { pid }, type: QueryTypes.SELECT })

        res.json({
            success: true,
            data: {
                aggregate: {
                    plays: agg?.plays || 0,
                    totalMs: typeof agg?.totalMs === 'string' ? parseInt(agg.totalMs,10) : Number(agg?.totalMs)||0,
                    avgMs: typeof agg?.avgMs === 'string' ? parseInt(agg.avgMs,10) : Number(agg?.avgMs)||0,
                    minutes: ((typeof agg?.totalMs === 'string' ? parseInt(agg.totalMs,10) : Number(agg?.totalMs)||0) / 60000),
                    ormSum: typeof ormSum === 'string' ? parseInt(ormSum,10) : Number(ormSum)||0
                },
                rawRows: rawRows.map(r => ({
                    id: r.id,
                    profileId: r.profileId,
                    msPlayed: typeof r.msPlayed === 'string' ? r.msPlayed : String(r.msPlayed),
                    timestamp: r.timestamp
                })),
                sample: samples.map(s => ({ id: s.id, episodeId: s.episodeId, msPlayed: s.msPlayed, timestamp: s.timestamp })),
                byHour: (hours as any[]).map(h => ({
                    hour: h.hour,
                    plays: typeof h.plays === 'string' ? parseInt(h.plays,10) : Number(h.plays)||0,
                    totalMs: typeof h.totalMs === 'string' ? parseInt(h.totalMs,10) : Number(h.totalMs)||0,
                    minutes: (typeof h.totalMs === 'string' ? parseInt(h.totalMs,10) : Number(h.totalMs)||0)/60000
                })),
                topEpisodes: (topEpisodes as any[]).map(te => ({
                    name: te.name,
                    plays: typeof te.plays === 'string' ? parseInt(te.plays,10) : Number(te.plays)||0,
                    totalMs: typeof te.totalMs === 'string' ? parseInt(te.totalMs,10) : Number(te.totalMs)||0,
                    minutes: (typeof te.totalMs === 'string' ? parseInt(te.totalMs,10) : Number(te.totalMs)||0)/60000
                })),
                env: { MIN_MS_PLAYED: process.env.MIN_MS_PLAYED }
            }
        })
    } catch (error) {
        console.error('Error in debug/ms endpoint', error)
        res.json({ success: false, message: 'debug failed' })
    }
})
