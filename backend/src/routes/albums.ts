import express from 'express'
import { Play } from '../models/Play.js'

const router = express.Router()

// GET /api/albums/top - Top albumy
router.get('/top', async (req, res) => {
    try {
        const { limit = 10 } = req.query
        const limitNum = parseInt(limit as string)

        const topAlbums = await Play.aggregate([
            // Join with tracks
            {
                $lookup: {
                    from: 'tracks',
                    localField: 'trackId',
                    foreignField: '_id',
                    as: 'track'
                }
            },
            { $unwind: '$track' },

            // Join with albums
            {
                $lookup: {
                    from: 'albums',
                    localField: 'track.albumId',
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

            // Group by album
            {
                $group: {
                    _id: '$album._id',
                    albumName: { $first: '$album.name' },
                    artistName: { $first: '$artist.name' },
                    totalPlays: { $sum: 1 },
                    totalMinutes: { $sum: '$msPlayed' }
                }
            },

            // Sort and limit
            { $sort: { totalPlays: -1 } },
            { $limit: limitNum },

            // Project final fields
            {
                $project: {
                    albumId: '$_id',
                    albumName: 1,
                    artistName: 1,
                    totalPlays: 1,
                    totalMinutes: { $round: [{ $divide: ['$totalMinutes', 60000] }, 1] }
                }
            }
        ])

        res.json({
            success: true,
            data: topAlbums
        })

    } catch (error) {
        console.error('Error fetching top albums:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top albums',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
