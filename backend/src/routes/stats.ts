import express from 'express'
import { Op, fn, col } from 'sequelize'
import { Track } from '../models/Track.js'
import { Album } from '../models/Album.js'
import { Artist } from '../models/Artist.js'
import { Play } from '../models/Play.js'

console.log('Stats router loaded')
const router = express.Router()

// Test route
router.get('/test', (_req, res) => {
    res.json({ message: 'Stats router working' })
})

// GET /api/stats/overview - Ogólne statystyki
router.get('/overview', async (req, res) => {
    console.log('Stats overview endpoint called')
    try {
        const { profileId } = req.query
        const filter = profileId ? { profileId } : {}

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
            profileId ?
                Play.count({
                    where: filter,
                    include: [
                        {
                            model: Track,
                            as: 'track',
                            include: [
                                {
                                    model: Album,
                                    as: 'album'
                                }
                            ]
                        }
                    ],
                    distinct: true,
                    col: 'track.album.artistId'
                }) :
                Artist.count(),
            profileId ?
                Play.count({
                    where: filter,
                    include: [
                        {
                            model: Track,
                            as: 'track'
                        }
                    ],
                    distinct: true,
                    col: 'track.albumId'
                }) :
                Album.count()
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
            topCountry: topCountryData[0]?.country || 'Unknown'
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

export default router
