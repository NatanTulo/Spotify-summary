import express from 'express'
import { Artist } from '../models/Artist.js'
import { Play } from '../models/Play.js'
import { ArtistStats } from '../models/index.js'
import mongoose from 'mongoose'

const router = express.Router()

// GET /api/artists/top - Top artyści
router.get('/top', async (req, res) => {
    try {
        const { limit = 10, profileId } = req.query
        const limitNum = parseInt(limit as string)

        if (profileId) {
            // Użyj zagregowanych danych dla konkretnego profilu
            const topArtists = await ArtistStats.find({ profileId: new mongoose.Types.ObjectId(profileId as string) })
                .sort({ totalPlays: -1 })
                .limit(limitNum)
                .lean()

            const formattedArtists = topArtists.map(artist => ({
                name: artist.artistName,
                plays: artist.totalPlays,
                minutes: artist.totalMinutes
            }))

            res.json({
                success: true,
                data: formattedArtists
            })
        } else {
            // Dla wszystkich profili - agreguj na bieżąco
            const topArtists = await Play.aggregate([
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

                // Group by artist
                {
                    $group: {
                        _id: '$artist._id',
                        name: { $first: '$artist.name' },
                        plays: { $sum: 1 },
                        minutes: { $sum: '$msPlayed' }
                    }
                },

                // Sort and limit
                { $sort: { plays: -1 } },
                { $limit: limitNum },

                // Project final fields
                {
                    $project: {
                        name: 1,
                        plays: 1,
                        minutes: { $round: [{ $divide: ['$minutes', 60000] }, 1] }
                    }
                }
            ])

            res.json({
                success: true,
                data: topArtists
            })
        }

    } catch (error) {
        console.error('Error fetching top artists:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top artists',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/artists/:id - Szczegóły artysty
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params

        const artist = await Artist.findById(id)
        if (!artist) {
            return res.status(404).json({
                success: false,
                error: 'Artist not found'
            })
        }

        // Get artist statistics
        const stats = await Play.aggregate([
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

            // Filter by artist
            {
                $match: {
                    'album.artistId': artist._id
                }
            },

            // Calculate stats
            {
                $group: {
                    _id: null,
                    totalPlays: { $sum: 1 },
                    totalMinutes: { $sum: '$msPlayed' },
                    firstPlay: { $min: '$timestamp' },
                    lastPlay: { $max: '$timestamp' }
                }
            },

            {
                $project: {
                    totalPlays: 1,
                    totalMinutes: { $round: [{ $divide: ['$totalMinutes', 60000] }, 1] },
                    firstPlay: 1,
                    lastPlay: 1
                }
            }
        ])

        res.json({
            success: true,
            data: {
                artist,
                stats: stats[0] || {
                    totalPlays: 0,
                    totalMinutes: 0,
                    firstPlay: null,
                    lastPlay: null
                }
            }
        })

    } catch (error) {
        console.error('Error fetching artist details:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch artist details',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
