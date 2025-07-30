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
 * Pobierz statystyki video/podcastów
 */
router.get('/video-stats', async (req: Request, res: Response) => {
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

        // Podstawowe statystyki podcastów - uproszczone zapytania
        const totalPodcastPlays = await PodcastPlay.count({
            where: { profileId }
        }) || 0

        const totalPodcastTimeResult = await PodcastPlay.sum('msPlayed', {
            where: { profileId }
        })
        const totalPodcastTime = totalPodcastTimeResult || 0

        const uniqueEpisodes = await PodcastPlay.count({
            distinct: true,
            col: 'episodeId',
            where: { profileId }
        }) || 0

        // Proste zapytanie dla uniqueShows przez subquery
        const uniqueShowsResult = await PodcastPlay.count({
            distinct: true,
            col: 'episodeId',
            where: { profileId },
            include: [
                {
                    model: Episode,
                    attributes: ['showId'],
                    required: true
                }
            ]
        }) || 0

        res.json({
            success: true,
            data: {
                overview: {
                    totalPodcastPlays: totalPodcastPlays,
                    totalPodcastMinutes: Math.round(totalPodcastTime / 60000),
                    uniqueShows: uniqueShowsResult,
                    uniqueEpisodes
                },
                topShows: [] // Tymczasowo puste, będzie wypełnione gdy będą dane
            }
        })
    } catch (error) {
        console.error('Error fetching podcast stats:', error)
        // Zwróć podstawowe statystyki zerowe jeśli wystąpi błąd
        res.json({
            success: true,
            data: {
                overview: {
                    totalPodcastPlays: 0,
                    totalPodcastMinutes: 0,
                    uniqueShows: 0,
                    uniqueEpisodes: 0
                },
                topShows: []
            }
        })
    }
})

export default router
