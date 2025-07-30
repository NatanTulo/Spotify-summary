import express from 'express'
import { Op, fn, col, QueryTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { Play } from '../models/music/Play.js'
import { PodcastPlay } from '../models/podcasts/PodcastPlay.js'

console.log('Stats router loaded')
const router = express.Router()

// Test route
router.get('/test', (_req, res) => {
    res.json({ message: 'Stats router working' })
})

// GET /api/stats/overview - Ogólne statystyki
router.get('/overview', async (req, res) => {
    try {
        const { profileId } = req.query

        // Jeśli profileId = 'all' lub brak profileId, agreguj wszystkie profile
        // Jeśli jest konkretny profileId, filtruj po nim
        const filter = profileId && profileId !== 'all' ? { profileId } : {}

        const [
            totalPlays,
            totalMinutes,
            uniqueTracks,
            uniqueArtists,
            uniqueAlbums
        ] = await Promise.all([
            Play.count({ where: filter }),
            Play.sum('msPlayed', { where: filter }),
            Play.count({
                where: filter,
                distinct: true,
                col: 'trackId'
            }),
            sequelize.query(`
                SELECT COUNT(DISTINCT artists.id) as count
                FROM plays
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                JOIN artists ON albums."artistId" = artists.id
                ${profileId && profileId !== 'all' ? 'WHERE plays."profileId" = :profileId' : ''}
            `, {
                replacements: profileId && profileId !== 'all' ? { profileId } : {},
                type: QueryTypes.SELECT
            }).then((result: any[]) => parseInt(result[0]?.count) || 0),
            sequelize.query(`
                SELECT COUNT(DISTINCT albums.id) as count
                FROM plays
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id
                ${profileId && profileId !== 'all' ? 'WHERE plays."profileId" = :profileId' : ''}
            `, {
                replacements: profileId && profileId !== 'all' ? { profileId } : {},
                type: QueryTypes.SELECT
            }).then((result: any[]) => parseInt(result[0]?.count) || 0)
        ])

        // Get top country
        const topCountryData = await Play.findAll({
            where: {
                ...filter,
                country: { [Op.ne]: null }
            },
            attributes: [
                'country',
                [fn('COUNT', col('id')), 'plays']
            ],
            group: ['country'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: 1,
            raw: true
        })

        // Get average session duration
        const avgSessionData = await Play.findAll({
            where: filter,
            attributes: [
                [fn('AVG', col('msPlayed')), 'avgDuration']
            ],
            raw: true
        })

        const overview = {
            totalPlays: totalPlays || 0,
            totalMinutes: Math.round((totalMinutes || 0) / 60000),
            uniqueTracks: uniqueTracks || 0,
            uniqueArtists: uniqueArtists || 0,
            uniqueAlbums: uniqueAlbums || 0,
            avgSessionDuration: Math.round((parseFloat((avgSessionData[0] as any)?.avgDuration) || 0) / 1000),
            topCountry: topCountryData[0]?.country || null
        }

        res.json({
            success: true,
            data: overview
        })
    } catch (error) {
        console.error('Error fetching overview stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch overview statistics'
        })
    }
})

// GET /api/stats/yearly - Statystyki roczne
router.get('/yearly', async (req, res) => {
    console.log('Yearly stats endpoint called')
    try {
        const { profileId } = req.query
        const filter = profileId ? { profileId: parseInt(profileId as string) } : {}

        const yearlyStats = await Play.findAll({
            where: filter,
            attributes: [
                [fn('DATE_PART', 'year', col('timestamp')), 'year'],
                [fn('COUNT', col('id')), 'plays'],
                [fn('SUM', col('msPlayed')), 'totalMs']
            ],
            group: [fn('DATE_PART', 'year', col('timestamp'))],
            order: [[fn('DATE_PART', 'year', col('timestamp')), 'ASC']],
            raw: true
        })

        const formattedStats = yearlyStats.map((stat: any) => ({
            year: parseInt(stat.year),
            plays: parseInt(stat.plays),
            totalMinutes: Math.round(stat.totalMs / 60000)
        }))

        res.json({
            success: true,
            data: formattedStats
        })
    } catch (error) {
        console.error('Error fetching yearly stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch yearly statistics'
        })
    }
})

// GET /api/stats/countries - Statystyki krajów
router.get('/countries', async (req, res) => {
    console.log('Countries stats endpoint called')
    try {
        const { profileId } = req.query
        const filter = profileId ? { profileId: parseInt(profileId as string) } : {}

        const countryStats = await Play.findAll({
            where: {
                ...filter,
                country: { [Op.ne]: null }
            },
            attributes: [
                'country',
                [fn('COUNT', col('id')), 'plays'],
                [fn('SUM', col('msPlayed')), 'totalMs']
            ],
            group: ['country'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            limit: 20,
            raw: true
        })

        const formattedStats = countryStats.map((stat: any) => ({
            country: stat.country,
            plays: parseInt(stat.plays),
            totalMinutes: Math.round(stat.totalMs / 60000)
        }))

        res.json({
            success: true,
            data: formattedStats
        })
    } catch (error) {
        console.error('Error fetching countries stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch countries statistics'
        })
    }
})

// GET /api/stats/timeline - Statystyki timeline (dzienne)
router.get('/timeline', async (req, res) => {
    try {
        const { profileId, period = 'day' } = req.query
        const filter = profileId ? { profileId: parseInt(profileId as string) } : {}

        let dateFormat: string
        switch (period) {
            case 'month':
                dateFormat = 'YYYY-MM'
                break
            case 'week':
                dateFormat = 'YYYY-WW'
                break
            case 'year':
                dateFormat = 'YYYY'
                break
            default: // 'day'
                dateFormat = 'YYYY-MM-DD'
        }

        const timelineStats = await Play.findAll({
            where: filter,
            attributes: [
                [fn('TO_CHAR', col('timestamp'), dateFormat), 'period'],
                [fn('COUNT', col('id')), 'plays'],
                [fn('SUM', col('msPlayed')), 'totalMs']
            ],
            group: [fn('TO_CHAR', col('timestamp'), dateFormat)],
            order: [[fn('TO_CHAR', col('timestamp'), dateFormat), 'ASC']],
            raw: true
        })

        const formattedStats = timelineStats.map((stat: any) => ({
            period: stat.period,
            plays: parseInt(stat.plays),
            totalMinutes: Math.round(stat.totalMs / 60000)
        }))

        res.json({
            success: true,
            data: formattedStats
        })
    } catch (error) {
        console.error('Error fetching timeline stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch timeline statistics'
        })
    }
})

// GET /api/stats/video - Statystyki wideo
router.get('/video', async (req, res) => {
    try {
        const { profileId } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                error: 'ProfileId is required'
            })
        }

        const filter = { profileId }

        const [
            totalPodcastPlays,
            totalPodcastMinutes,
            uniqueShows,
            uniqueEpisodes
        ] = await Promise.all([
            PodcastPlay.count({ where: filter }),
            PodcastPlay.sum('msPlayed', { where: filter }),
            sequelize.query(`
                SELECT COUNT(DISTINCT shows.id) as count
                FROM podcast_plays
                JOIN episodes ON podcast_plays."episodeId" = episodes.id
                JOIN shows ON episodes."showId" = shows.id
                WHERE podcast_plays."profileId" = :profileId
            `, {
                replacements: { profileId },
                type: QueryTypes.SELECT
            }).then((result: any[]) => parseInt(result[0]?.count) || 0),
            PodcastPlay.count({
                where: filter,
                distinct: true,
                col: 'episodeId'
            })
        ])

        res.json({
            success: true,
            data: {
                totalPodcastPlays: totalPodcastPlays || 0,
                totalPodcastMinutes: Math.round((totalPodcastMinutes || 0) / 60000),
                uniqueShows: uniqueShows || 0,
                uniqueEpisodes: uniqueEpisodes || 0
            }
        })
    } catch (error) {
        console.error('Error fetching video stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch video statistics'
        })
    }
})

// GET /api/stats/podcasts - Statystyki podcastów
router.get('/podcasts', async (req, res) => {
    try {
        const { profileId } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                error: 'ProfileId is required'
            })
        }

        const filter = { profileId }

        const [
            totalPodcastPlays,
            totalPodcastMinutes,
            uniqueShows,
            uniqueEpisodes
        ] = await Promise.all([
            PodcastPlay.count({ where: filter }),
            PodcastPlay.sum('msPlayed', { where: filter }),
            sequelize.query(`
                SELECT COUNT(DISTINCT shows.id) as count
                FROM podcast_plays
                JOIN episodes ON podcast_plays."episodeId" = episodes.id
                JOIN shows ON episodes."showId" = shows.id
                WHERE podcast_plays."profileId" = :profileId
            `, {
                replacements: { profileId },
                type: QueryTypes.SELECT
            }).then((result: any[]) => parseInt(result[0]?.count) || 0),
            PodcastPlay.count({
                where: filter,
                distinct: true,
                col: 'episodeId'
            })
        ])

        res.json({
            success: true,
            data: {
                totalPodcastPlays: totalPodcastPlays || 0,
                totalPodcastMinutes: Math.round((totalPodcastMinutes || 0) / 60000),
                uniqueShows: uniqueShows || 0,
                uniqueEpisodes: uniqueEpisodes || 0
            }
        })
    } catch (error) {
        console.error('Error fetching podcast stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch podcast statistics'
        })
    }
})

export default router
