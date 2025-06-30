import express from 'express'
import mongoose from 'mongoose'
import { Track } from '../models/Track.js'
import { Play } from '../models/Play.js'

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
            sortOrder = 'desc'
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const minPlaysNum = parseInt(minPlays as string)

        // Aggregation pipeline
        const pipeline: any[] = [
            // Join with albums
            {
                $lookup: {
                    from: 'albums',
                    localField: 'albumId',
                    foreignField: '_id',
                    as: 'album'
                }
            },
            { $unwind: '$album' },

            // Join with artists
            {
                $lookup: {
                    from: 'artists',
                    localField: 'album.artistId',
                    foreignField: '_id',
                    as: 'artist'
                }
            },
            { $unwind: '$artist' },

            // Join with plays to get statistics
            {
                $lookup: {
                    from: 'plays',
                    localField: '_id',
                    foreignField: 'trackId',
                    as: 'plays'
                }
            },

            // Calculate statistics
            {
                $addFields: {
                    totalPlays: { $size: '$plays' },
                    totalMinutes: {
                        $divide: [
                            { $sum: '$plays.msPlayed' },
                            60000
                        ]
                    },
                    avgPlayDuration: {
                        $cond: {
                            if: { $gt: [{ $size: '$plays' }, 0] },
                            then: {
                                $divide: [
                                    { $avg: '$plays.msPlayed' },
                                    1000
                                ]
                            },
                            else: 0
                        }
                    },
                    skipPercentage: {
                        $cond: {
                            if: { $gt: [{ $size: '$plays' }, 0] },
                            then: {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $size: { $filter: { input: '$plays', cond: { $eq: ['$$this.skipped', true] } } } },
                                            { $size: '$plays' }
                                        ]
                                    },
                                    100
                                ]
                            },
                            else: 0
                        }
                    }
                }
            },

            // Filter by minimum plays
            {
                $match: {
                    totalPlays: { $gte: minPlaysNum }
                }
            },

            // Search filter
            ...(search ? [{
                $match: {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { 'artist.name': { $regex: search, $options: 'i' } },
                        { 'album.name': { $regex: search, $options: 'i' } }
                    ]
                }
            }] : []),

            // Project final fields
            {
                $project: {
                    trackId: '$_id',
                    trackName: '$name',
                    artistName: '$artist.name',
                    albumName: '$album.name',
                    totalPlays: 1,
                    totalMinutes: { $round: ['$totalMinutes', 1] },
                    avgPlayDuration: { $round: ['$avgPlayDuration', 1] },
                    skipPercentage: { $round: ['$skipPercentage', 1] }
                }
            },

            // Sort
            {
                $sort: {
                    [sortBy as string]: sortOrder === 'desc' ? -1 : 1
                }
            }
        ]

        // Get total count for pagination
        const countPipeline = [...pipeline, { $count: 'total' }]
        const countResult = await Track.aggregate(countPipeline)
        const total = countResult[0]?.total || 0

        // Add pagination
        const dataPipeline = [
            ...pipeline,
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum }
        ]

        const tracks = await Track.aggregate(dataPipeline)

        res.json({
            success: true,
            data: tracks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
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

// GET /api/tracks/:id - Szczegóły utworu
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const pipeline = [
            { $match: { _id: new Track().constructor.prototype.constructor.ObjectId(id) } },

            // Join with albums
            {
                $lookup: {
                    from: 'albums',
                    localField: 'albumId',
                    foreignField: '_id',
                    as: 'album'
                }
            },
            { $unwind: '$album' },

            // Join with artists
            {
                $lookup: {
                    from: 'artists',
                    localField: 'album.artistId',
                    foreignField: '_id',
                    as: 'artist'
                }
            },
            { $unwind: '$artist' },

            // Join with plays
            {
                $lookup: {
                    from: 'plays',
                    localField: '_id',
                    foreignField: 'trackId',
                    as: 'plays'
                }
            },

            // Calculate detailed statistics
            {
                $addFields: {
                    totalPlays: { $size: '$plays' },
                    totalMinutes: { $divide: [{ $sum: '$plays.msPlayed' }, 60000] },
                    avgPlayDuration: {
                        $cond: {
                            if: { $gt: [{ $size: '$plays' }, 0] },
                            then: { $divide: [{ $avg: '$plays.msPlayed' }, 1000] },
                            else: 0
                        }
                    },
                    skipPercentage: {
                        $cond: {
                            if: { $gt: [{ $size: '$plays' }, 0] },
                            then: {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $size: { $filter: { input: '$plays', cond: { $eq: ['$$this.skipped', true] } } } },
                                            { $size: '$plays' }
                                        ]
                                    },
                                    100
                                ]
                            },
                            else: 0
                        }
                    },
                    platforms: {
                        $reduce: {
                            input: '$plays.platform',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: { $in: ['$$this', '$$value'] },
                                    then: '$$value',
                                    else: { $concatArrays: ['$$value', ['$$this']] }
                                }
                            }
                        }
                    },
                    countries: {
                        $reduce: {
                            input: '$plays.country',
                            initialValue: [],
                            in: {
                                $cond: {
                                    if: { $in: ['$$this', '$$value'] },
                                    then: '$$value',
                                    else: { $concatArrays: ['$$value', ['$$this']] }
                                }
                            }
                        }
                    }
                }
            },

            {
                $project: {
                    trackId: '$_id',
                    trackName: '$name',
                    artistName: '$artist.name',
                    albumName: '$album.name',
                    uri: 1,
                    duration: 1,
                    totalPlays: 1,
                    totalMinutes: { $round: ['$totalMinutes', 1] },
                    avgPlayDuration: { $round: ['$avgPlayDuration', 1] },
                    skipPercentage: { $round: ['$skipPercentage', 1] },
                    platforms: 1,
                    countries: 1,
                    firstPlay: { $min: '$plays.timestamp' },
                    lastPlay: { $max: '$plays.timestamp' }
                }
            }
        ]

        const result = await Track.aggregate(pipeline)
        const track = result[0]

        if (!track) {
            return res.status(404).json({
                success: false,
                error: 'Track not found'
            })
        }

        res.json({
            success: true,
            data: track
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

// GET /api/tracks/:id/timeline - Timeline odtworzeń dla konkretnego utworu
router.get('/:id/timeline', async (req, res) => {
    try {
        const { id } = req.params
        const { days = 30 } = req.query
        const daysNum = parseInt(days as string)

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - daysNum)

        const timeline = await Play.aggregate([
            {
                $match: {
                    trackId: new mongoose.Types.ObjectId(id),
                    timestamp: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    plays: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id",
                    plays: 1,
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ])

        res.json({
            success: true,
            data: timeline
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

export default router
