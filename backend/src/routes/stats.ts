import express from 'express'
import { Track } from '../models/Track.js'
import { Album } from '../models/Album.js'
import { Artist } from '../models/Artist.js'
import { Play } from '../models/Play.js'
import { YearlyStats, CountryStats } from '../models/index.js'
import mongoose from 'mongoose'

const router = express.Router()

// GET /api/stats/overview - Ogólne statystyki
router.get('/overview', async (req, res) => {
    try {
        const { profileId } = req.query
        const filter = profileId ? { profileId } : {}

        const [
            totalPlays,
            totalMinutes,
            uniqueTracks,
            uniqueArtists,
            uniqueAlbums,
            avgSessionData,
            topCountryData
        ] = await Promise.all([
            Play.countDocuments(filter),
            Play.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$msPlayed' } } }
            ]),
            profileId ?
                Play.distinct('trackId', filter).then(ids => ids.length) :
                Track.countDocuments(),
            profileId ?
                Play.aggregate([
                    { $match: filter },
                    { $lookup: { from: 'tracks', localField: 'trackId', foreignField: '_id', as: 'track' } },
                    { $lookup: { from: 'albums', localField: 'track.albumId', foreignField: '_id', as: 'album' } },
                    { $group: { _id: '$album.artistId' } },
                    { $count: 'total' }
                ]).then(result => result[0]?.total || 0) :
                Artist.countDocuments(),
            profileId ?
                Play.aggregate([
                    { $match: filter },
                    { $lookup: { from: 'tracks', localField: 'trackId', foreignField: '_id', as: 'track' } },
                    { $group: { _id: '$track.albumId' } },
                    { $count: 'total' }
                ]).then(result => result[0]?.total || 0) :
                Album.countDocuments(),
            Play.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                        },
                        avgSession: { $avg: '$msPlayed' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgSessionLength: { $avg: '$avgSession' }
                    }
                }
            ]),
            Play.aggregate([
                { $match: { ...filter, country: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: '$country',
                        totalPlays: { $sum: 1 }
                    }
                },
                { $sort: { totalPlays: -1 } },
                { $limit: 1 }
            ])
        ])

        const stats = {
            totalPlays: totalPlays || 0,
            totalMinutes: Math.round((totalMinutes[0]?.total || 0) / 60000),
            uniqueTracks: uniqueTracks || 0,
            uniqueArtists: uniqueArtists || 0,
            uniqueAlbums: uniqueAlbums || 0,
            avgSessionLength: Math.round((avgSessionData[0]?.avgSessionLength || 0) / 60000),
            topCountry: topCountryData[0]?._id || '——'
        }

        res.json({
            success: true,
            data: stats
        })

    } catch (error) {
        console.error('Error fetching overview stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/stats/yearly - Statystyki roczne
router.get('/yearly', async (req, res) => {
    try {
        const { profileId } = req.query

        if (profileId) {
            // Użyj zagregowanych danych dla konkretnego profilu
            const yearlyStats = await YearlyStats.find({ profileId: new mongoose.Types.ObjectId(profileId as string) })
                .sort({ year: 1 })
                .lean()

            const formattedStats = yearlyStats.map(stat => ({
                year: stat.year,
                plays: stat.totalPlays,
                minutes: stat.totalMinutes,
                topArtist: stat.topArtist?.name
            }))

            res.json({
                success: true,
                data: formattedStats
            })
        } else {
            // Dla wszystkich profili - agreguj na bieżąco (rzadziej używane)
            const yearlyStats = await Play.aggregate([
                {
                    $group: {
                        _id: { $year: '$timestamp' },
                        totalPlays: { $sum: 1 },
                        totalMinutes: { $sum: '$msPlayed' }
                    }
                },
                {
                    $project: {
                        year: '$_id',
                        plays: '$totalPlays',
                        minutes: { $round: [{ $divide: ['$totalMinutes', 60000] }, 0] }
                    }
                },
                { $sort: { year: 1 } }
            ])

            res.json({
                success: true,
                data: yearlyStats
            })
        }

    } catch (error) {
        console.error('Error fetching yearly stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch yearly stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/stats/countries - Statystyki krajów
router.get('/countries', async (req, res) => {
    try {
        const { profileId } = req.query

        if (profileId) {
            // Użyj zagregowanych danych dla konkretnego profilu
            const countryStats = await CountryStats.find({ profileId: new mongoose.Types.ObjectId(profileId as string) })
                .sort({ totalPlays: -1 })
                .limit(10)
                .lean()

            const formattedStats = countryStats.map(stat => ({
                country: stat.country,
                plays: stat.totalPlays,
                percentage: stat.percentage
            }))

            res.json({
                success: true,
                data: formattedStats
            })
        } else {
            // Dla wszystkich profili - agreguj na bieżąco
            const countryStats = await Play.aggregate([
                { $match: { country: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: '$country',
                        totalPlays: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        country: '$_id',
                        plays: '$totalPlays'
                    }
                },
                { $sort: { plays: -1 } },
                { $limit: 10 }
            ])

            // Calculate total plays to get percentages
            const totalPlays = await Play.countDocuments({})

            const countriesWithPercentage = countryStats.map(country => ({
                ...country,
                percentage: Math.round((country.plays / totalPlays) * 100 * 100) / 100
            }))

            res.json({
                success: true,
                data: countriesWithPercentage
            })
        }

    } catch (error) {
        console.error('Error fetching country stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch country stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/stats/timeline - Dzienne statystyki dla timeline
router.get('/timeline', async (req, res) => {
    try {
        const { profileId, days = 30 } = req.query
        const daysNum = parseInt(days as string)

        // Zawsze używaj agregacji na bieżąco - jest bardziej niezawodna
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(endDate.getDate() - daysNum)

        const matchConditions: any = {
            timestamp: {
                $gte: startDate,
                $lte: endDate
            }
        }

        // Add profile filter if provided
        if (profileId) {
            matchConditions.profileId = new mongoose.Types.ObjectId(profileId as string)
        }

        const timelineStats = await Play.aggregate([
            {
                $match: matchConditions
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp"
                        }
                    },
                    plays: { $sum: 1 },
                    minutes: { $sum: "$msPlayed" }
                }
            },
            {
                $project: {
                    date: "$_id",
                    plays: 1,
                    minutes: { $round: [{ $divide: ["$minutes", 60000] }, 0] },
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ])

        res.json({
            success: true,
            data: timelineStats
        })

    } catch (error) {
        console.error('Error fetching timeline stats:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch timeline stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/stats/compare/:profileId1/:profileId2 - Porównanie dwóch profili
router.get('/compare/:profileId1/:profileId2', async (req, res) => {
    try {
        const { profileId1, profileId2 } = req.params

        const [profile1Stats, profile2Stats, commonTracks] = await Promise.all([
            // Stats profilu 1
            Play.aggregate([
                { $match: { profileId: profileId1 } },
                {
                    $group: {
                        _id: null,
                        totalPlays: { $sum: 1 },
                        totalMinutes: { $sum: '$msPlayed' },
                        uniqueTracks: { $addToSet: '$trackId' }
                    }
                },
                {
                    $project: {
                        totalPlays: 1,
                        totalMinutes: { $round: [{ $divide: ['$totalMinutes', 60000] }, 0] },
                        uniqueTracks: { $size: '$uniqueTracks' }
                    }
                }
            ]),
            // Stats profilu 2
            Play.aggregate([
                { $match: { profileId: profileId2 } },
                {
                    $group: {
                        _id: null,
                        totalPlays: { $sum: 1 },
                        totalMinutes: { $sum: '$msPlayed' },
                        uniqueTracks: { $addToSet: '$trackId' }
                    }
                },
                {
                    $project: {
                        totalPlays: 1,
                        totalMinutes: { $round: [{ $divide: ['$totalMinutes', 60000] }, 0] },
                        uniqueTracks: { $size: '$uniqueTracks' }
                    }
                }
            ]),
            // Wspólne utwory
            Play.aggregate([
                {
                    $match: {
                        profileId: { $in: [profileId1, profileId2] }
                    }
                },
                {
                    $group: {
                        _id: '$trackId',
                        profiles: { $addToSet: '$profileId' },
                        totalPlays: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        'profiles.1': { $exists: true }
                    }
                },
                {
                    $lookup: {
                        from: 'tracks',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'track'
                    }
                },
                {
                    $lookup: {
                        from: 'albums',
                        localField: 'track.albumId',
                        foreignField: '_id',
                        as: 'album'
                    }
                },
                {
                    $lookup: {
                        from: 'artists',
                        localField: 'album.artistId',
                        foreignField: '_id',
                        as: 'artist'
                    }
                },
                {
                    $project: {
                        trackName: { $arrayElemAt: ['$track.name', 0] },
                        albumName: { $arrayElemAt: ['$album.name', 0] },
                        artistName: { $arrayElemAt: ['$artist.name', 0] },
                        totalPlays: 1
                    }
                },
                { $sort: { totalPlays: -1 } },
                { $limit: 50 }
            ])
        ])

        res.json({
            success: true,
            data: {
                profile1: profile1Stats[0] || { totalPlays: 0, totalMinutes: 0, uniqueTracks: 0 },
                profile2: profile2Stats[0] || { totalPlays: 0, totalMinutes: 0, uniqueTracks: 0 },
                commonTracks: commonTracks,
                commonTracksCount: commonTracks.length
            }
        })

    } catch (error) {
        console.error('Error comparing profiles:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to compare profiles',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
