import express from 'express'
import { Op, fn, col, literal } from 'sequelize'
import { Track, Album, Artist, Play, Profile } from '../models/index.js'

const router = express.Router()

// GET /api/tracks - Lista utworów z filtrowaniem i paginacją
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            minPlays = 0,
            sortBy = 'totalPlays',
            sortOrder = 'desc',
            profileId
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const minPlaysNum = parseInt(minPlays as string)

        // Build where condition for search
        const searchCondition = search ? {
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { '$album.name$': { [Op.iLike]: `%${search}%` } },
                { '$album.artist.name$': { [Op.iLike]: `%${search}%` } }
            ]
        } : {}

        // Build where condition for plays
        const playCondition = profileId ? { profileId } : {}

        // Get tracks with aggregated data
        const { rows: tracks, count: totalCount } = await Track.findAndCountAll({
            include: [
                {
                    model: Album,
                    as: 'album',
                    include: [
                        {
                            model: Artist,
                            as: 'artist'
                        }
                    ]
                },
                {
                    model: Play,
                    as: 'plays',
                    where: playCondition,
                    required: false,
                    attributes: []
                }
            ],
            where: searchCondition,
            attributes: [
                'id',
                'name',
                'duration',
                'explicit',
                'popularity',
                'previewUrl',
                'spotifyId',
                [fn('COUNT', col('plays.id')), 'totalPlays'],
                [fn('COALESCE', fn('SUM', col('plays.msPlayed')), 0), 'totalMsPlayed'],
                [fn('COALESCE', fn('AVG', col('plays.msPlayed')), 0), 'avgMsPlayed'],
                [
                    literal(`COALESCE(
                        (SELECT COUNT(*)::float / NULLIF(COUNT(plays.id), 0) * 100
                         FROM plays 
                         WHERE plays."trackId" = "Track".id 
                         AND plays.skipped = true
                         ${profileId ? `AND plays."profileId" = '${profileId}'` : ''}), 
                        0
                    )`),
                    'skipPercentage'
                ]
            ],
            group: [
                'Track.id',
                'album.id',
                'album.artist.id'
            ],
            having: literal(`COUNT(plays.id) >= ${minPlaysNum}`),
            order: [
                [
                    sortBy === 'totalPlays' ? fn('COUNT', col('plays.id')) :
                        sortBy === 'totalMinutes' ? fn('SUM', col('plays.msPlayed')) :
                            sortBy === 'avgPlayDuration' ? fn('AVG', col('plays.msPlayed')) :
                                String(sortBy),
                    String(sortOrder).toUpperCase()
                ]
            ],
            limit: limitNum,
            offset: (pageNum - 1) * limitNum,
            subQuery: false,
            distinct: true
        })

        // Format the response
        const formattedTracks = tracks.map((track: any) => ({
            id: track.id,
            name: track.name,
            duration: track.duration,
            explicit: track.explicit,
            popularity: track.popularity,
            previewUrl: track.previewUrl,
            spotifyId: track.spotifyId,
            artist: {
                id: track.album.artist.id,
                name: track.album.artist.name,
                spotifyId: track.album.artist.spotifyId
            },
            album: {
                id: track.album.id,
                name: track.album.name,
                spotifyId: track.album.spotifyId,
                imageUrl: track.album.imageUrl,
                releaseDate: track.album.releaseDate
            },
            stats: {
                totalPlays: parseInt(track.getDataValue('totalPlays')) || 0,
                totalMinutes: Math.round((parseInt(track.getDataValue('totalMsPlayed')) || 0) / 60000),
                avgPlayDuration: Math.round((parseInt(track.getDataValue('avgMsPlayed')) || 0) / 1000),
                skipPercentage: Math.round(parseFloat(track.getDataValue('skipPercentage')) || 0)
            }
        }))

        res.json({
            success: true,
            data: formattedTracks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: Array.isArray(totalCount) ? totalCount.length : totalCount,
                pages: Math.ceil((Array.isArray(totalCount) ? totalCount.length : totalCount) / limitNum)
            }
        })
    } catch (error) {
        console.error('Error fetching tracks:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tracks',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/tracks/:id - Szczegóły konkretnego utworu
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { profileId } = req.query

        const track = await Track.findByPk(id, {
            include: [
                {
                    model: Album,
                    as: 'album',
                    include: [
                        {
                            model: Artist,
                            as: 'artist'
                        }
                    ]
                }
            ]
        })

        if (!track) {
            return res.status(404).json({
                success: false,
                error: 'Track not found'
            })
        }

        // Get plays statistics
        const playCondition = profileId ? { profileId, trackId: id } : { trackId: id }

        const playsStats = await Play.findOne({
            where: playCondition,
            attributes: [
                [fn('COUNT', col('id')), 'totalPlays'],
                [fn('COALESCE', fn('SUM', col('msPlayed')), 0), 'totalMsPlayed'],
                [fn('COALESCE', fn('AVG', col('msPlayed')), 0), 'avgMsPlayed'],
                [
                    literal(`COALESCE(COUNT(CASE WHEN skipped = true THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100, 0)`),
                    'skipPercentage'
                ]
            ],
            raw: true
        })

        // Get recent plays
        const recentPlays = await Play.findAll({
            where: playCondition,
            order: [['playedAt', 'DESC']],
            limit: 10,
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    attributes: ['id', 'name']
                }
            ]
        })

        res.json({
            success: true,
            data: {
                ...track.toJSON(),
                stats: {
                    totalPlays: parseInt((playsStats as any)?.totalPlays as string) || 0,
                    totalMinutes: Math.round((parseInt((playsStats as any)?.totalMsPlayed as string) || 0) / 60000),
                    avgPlayDuration: Math.round((parseInt((playsStats as any)?.avgMsPlayed as string) || 0) / 1000),
                    skipPercentage: Math.round(parseFloat((playsStats as any)?.skipPercentage as string) || 0)
                },
                recentPlays: recentPlays.map(play => ({
                    id: play.id,
                    playedAt: (play as any).playedAt,
                    msPlayed: play.msPlayed,
                    skipped: play.skipped,
                    platform: play.platform,
                    country: play.country,
                    profile: play.profile
                }))
            }
        })
    } catch (error) {
        console.error('Error fetching track details:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch track details',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/tracks/:id/timeline - Timeline odtwarzania utworu
router.get('/:id/timeline', async (req, res) => {
    try {
        const { id } = req.params
        const { profileId, interval = 'day' } = req.query

        const playCondition = profileId ? { profileId, trackId: id } : { trackId: id }

        // Group plays by time interval
        const timelineData = await Play.findAll({
            where: playCondition,
            attributes: [
                [
                    interval === 'month' ?
                        fn('DATE_TRUNC', 'month', col('playedAt')) :
                        fn('DATE_TRUNC', 'day', col('playedAt')),
                    'period'
                ],
                [fn('COUNT', col('id')), 'plays'],
                [fn('COALESCE', fn('SUM', col('msPlayed')), 0), 'totalMsPlayed']
            ],
            group: ['period'],
            order: [['period', 'ASC']],
            raw: true
        })

        const formattedData = timelineData.map((item: any) => ({
            period: item.period,
            plays: parseInt(item.plays),
            minutes: Math.round(parseInt(item.totalMsPlayed) / 60000)
        }))

        res.json({
            success: true,
            data: formattedData
        })
    } catch (error) {
        console.error('Error fetching track timeline:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch track timeline',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/tracks/:id/plays - Lista odtworzeń utworu
router.get('/:id/plays', async (req, res) => {
    try {
        const { id } = req.params
        const {
            page = 1,
            limit = 50,
            profileId
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)

        const playCondition = profileId ? { profileId, trackId: id } : { trackId: id }

        const plays = await Play.findAndCountAll({
            where: playCondition,
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    attributes: ['id', 'name']
                }
            ],
            order: [['playedAt', 'DESC']],
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
        })

        res.json({
            success: true,
            data: plays.rows.map(play => ({
                id: play.id,
                playedAt: (play as any).playedAt,
                msPlayed: play.msPlayed,
                skipped: play.skipped,
                platform: play.platform,
                country: play.country,
                profile: play.profile
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: plays.count,
                pages: Math.ceil(plays.count / limitNum)
            }
        })
    } catch (error) {
        console.error('Error fetching track plays:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch track plays',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
