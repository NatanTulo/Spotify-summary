import { Router, Request, Response } from 'express'
import { Op, QueryTypes } from 'sequelize'
import { Show, Episode, PodcastPlay, Profile } from '../../models/index.js'

const router = Router()

/**
 * Pobierz listę programów/podcastów
 */
router.get('/shows', async (req: Request, res: Response) => {
    try {
        const { limit = 50, offset = 0, search } = req.query

        const whereClause: any = {}
        if (search) {
            whereClause.name = { [Op.iLike]: `%${search}%` }
        }

        const shows = await Show.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            order: [['name', 'ASC']]
        })

        res.json({
            success: true,
            data: {
                shows: shows.rows,
                total: shows.count,
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
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
        const { limit = 50, offset = 0 } = req.query

        const episodes = await Episode.findAndCountAll({
            where: { showId: parseInt(showId) },
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
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
                limit: parseInt(limit as string),
                offset: parseInt(offset as string)
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

        const formattedStats = dailyStats.map((stat: any) => ({
            date: stat.date,
            plays: parseInt(stat.plays),
            minutes: Math.round((parseInt(stat.totalMs) || 0) / 60000)
        }))

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
