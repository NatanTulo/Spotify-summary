import { Router, Request, Response } from 'express'
import { Op } from 'sequelize'
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
            order: [['name', 'ASC']],
            distinct: true
        })

        res.json({
            success: true,
            data: shows.rows,
            total: shows.count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        })
    } catch (error) {
        console.error('Error fetching shows:', error)
        res.status(500).json({
            success: false,
            message: 'Błąd podczas pobierania programów'
        })
    }
})

/**
 * Pobierz listę odcinków dla programu
 */
router.get('/shows/:showId/episodes', async (req: Request, res: Response) => {
    try {
        const { showId } = req.params
        const { limit = 50, offset = 0, search } = req.query

        const whereClause: any = { showId }
        if (search) {
            whereClause.name = { [Op.iLike]: `%${search}%` }
        }

        const episodes = await Episode.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            order: [['name', 'ASC']]
        })

        res.json({
            success: true,
            data: episodes.rows,
            total: episodes.count,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        })
    } catch (error) {
        console.error('Error fetching episodes:', error)
        res.status(500).json({
            success: false,
            message: 'Błąd podczas pobierania odcinków'
        })
    }
})

/**
 * Pobierz statystyki podcastów
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
        const profile = await Profile.findByPk(profileId as string)
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            })
        }

        // Podstawowe statystyki podcastów
        const totalPodcastPlays = await PodcastPlay.count({
            where: { profileId }
        }) || 0

        const totalPodcastTimeResult = await PodcastPlay.sum('msPlayed', {
            where: { profileId }
        })
        const totalPodcastMinutes = Math.round((totalPodcastTimeResult || 0) / 60000)

        const uniqueEpisodes = await PodcastPlay.count({
            distinct: true,
            col: 'episodeId',
            where: { profileId }
        }) || 0

        const uniqueShows = await PodcastPlay.count({
            distinct: true,
            col: 'episodeShowUri',
            where: { profileId }
        }) || 0

        res.json({
            success: true,
            data: {
                totalPodcastPlays,
                totalPodcastMinutes,
                uniqueShows,
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
        const topShows = await PodcastPlay.findAll({
            attributes: [
                'showName',
                [PodcastPlay.sequelize!.fn('COUNT', '*'), 'playCount'],
                [PodcastPlay.sequelize!.fn('SUM', PodcastPlay.sequelize!.col('msPlayed')), 'totalTime']
            ],
            where: { profileId },
            group: ['showName'],
            order: [[PodcastPlay.sequelize!.literal('COUNT(*)'), 'DESC']],
            limit: parseInt(limit as string),
            raw: true
        })

        const formattedShows = topShows.map((show: any, index: number) => ({
            id: `show-${index}`,
            name: show.showName,
            playCount: parseInt(show.playCount),
            totalTime: parseInt(show.totalTime) || 0,
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

        const topEpisodes = await PodcastPlay.findAll({
            attributes: [
                'episodeName',
                'showName',
                [PodcastPlay.sequelize!.fn('COUNT', '*'), 'playCount'],
                [PodcastPlay.sequelize!.fn('SUM', PodcastPlay.sequelize!.col('msPlayed')), 'totalTime']
            ],
            where: { profileId },
            group: ['episodeName', 'showName'],
            order: [[PodcastPlay.sequelize!.literal('COUNT(*)'), 'DESC']],
            limit: parseInt(limit as string),
            raw: true
        })

        const formattedEpisodes = topEpisodes.map((episode: any, index: number) => ({
            id: `episode-${index}`,
            name: episode.episodeName,
            showName: episode.showName,
            playCount: parseInt(episode.playCount),
            totalTime: parseInt(episode.totalTime) || 0
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
 * Pobierz ostatnie odtwariane odcinki
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
            where: { profileId },
            order: [['ts', 'DESC']],
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
                [PodcastPlay.sequelize!.fn('DATE', PodcastPlay.sequelize!.col('ts')), 'date'],
                [PodcastPlay.sequelize!.fn('COUNT', '*'), 'plays'],
                [PodcastPlay.sequelize!.fn('SUM', PodcastPlay.sequelize!.col('msPlayed')), 'totalMs']
            ],
            where: {
                profileId,
                ts: {
                    [Op.gte]: startDate
                }
            },
            group: [PodcastPlay.sequelize!.fn('DATE', PodcastPlay.sequelize!.col('ts'))],
            order: [[PodcastPlay.sequelize!.fn('DATE', PodcastPlay.sequelize!.col('ts')), 'ASC']],
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
            platform: stat.platform,
            plays: parseInt(stat.plays),
            percentage: totalPlays > 0 ? (parseInt(stat.plays) / totalPlays) * 100 : 0
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
