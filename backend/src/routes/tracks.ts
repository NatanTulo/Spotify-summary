import express from 'express'
import { fn, col, literal, QueryTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { Track } from '../models/Track.js'
import { Album } from '../models/Album.js'
import { Artist } from '../models/Artist.js'
import { Play } from '../models/Play.js'
import { Profile } from '../models/Profile.js'

const router = express.Router()

// GET /api/tracks - Lista utworów z filtrowaniem i paginacją
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            sortBy = 'id',
            sortOrder = 'DESC',
            profileId
        } = req.query

        const pageNum = parseInt(page as string, 10)
        const limitNum = parseInt(limit as string, 10)
        const profileIdNum = profileId ? parseInt(profileId as string, 10) : null

        // Build search condition for tracks
        const searchCondition = search ? `
            AND (t.name ILIKE '%${search}%' 
                 OR al.name ILIKE '%${search}%' 
                 OR ar.name ILIKE '%${search}%')
        ` : ''

        // Build ORDER BY clause
        let orderBy = ''
        if (sortBy === 'totalPlays') {
            orderBy = `ORDER BY total_plays ${sortOrder}`
        } else if (sortBy === 'totalMinutes') {
            orderBy = `ORDER BY total_minutes ${sortOrder}`
        } else if (sortBy === 'name') {
            orderBy = `ORDER BY t.name ${sortOrder}`
        } else if (sortBy === 'artist') {
            orderBy = `ORDER BY ar.name ${sortOrder}`
        } else {
            orderBy = `ORDER BY t.id ${sortOrder}`
        }

        // Use raw query to get tracks with aggregated play statistics
        const tracksQuery = `
            SELECT 
                t.id,
                t.name as "trackName",
                t.duration,
                t.uri,
                ar.id as "artistId",
                ar.name as "artistName",
                al.id as "albumId",
                al.name as "albumName",
                COALESCE(p.total_plays, 0) as "totalPlays",
                COALESCE(p.total_minutes, 0) as "totalMinutes",
                COALESCE(p.avg_play_duration, 0) as "avgPlayDuration",
                COALESCE(p.skip_percentage, 0) as "skipPercentage",
                p.first_play as "firstPlay",
                p.last_play as "lastPlay",
                p.platforms as "platforms",
                p.countries as "countries",
                p.reason_start as "reasonStart",
                p.reason_end as "reasonEnd"
            FROM tracks t
            JOIN albums al ON t."albumId" = al.id
            JOIN artists ar ON al."artistId" = ar.id
            LEFT JOIN (
                SELECT 
                    "trackId",
                    COUNT(*) as total_plays,
                    ROUND((SUM("msPlayed") / 60000.0)::numeric, 2) as total_minutes,
                    ROUND(AVG("msPlayed")::numeric / 1000, 0) as avg_play_duration,
                    ROUND(
                        (COUNT(CASE WHEN skipped = true THEN 1 END)::float / 
                        NULLIF(COUNT(*), 0) * 100)::numeric, 
                        2
                    ) as skip_percentage,
                    MIN(timestamp) as first_play,
                    MAX(timestamp) as last_play,
                    ARRAY_AGG(DISTINCT platform ORDER BY platform) FILTER (WHERE platform IS NOT NULL) as platforms,
                    ARRAY_AGG(DISTINCT country ORDER BY country) FILTER (WHERE country IS NOT NULL) as countries,
                    ARRAY_AGG(DISTINCT "reasonStart" ORDER BY "reasonStart") FILTER (WHERE "reasonStart" IS NOT NULL) as reason_start,
                    ARRAY_AGG(DISTINCT "reasonEnd" ORDER BY "reasonEnd") FILTER (WHERE "reasonEnd" IS NOT NULL) as reason_end
                FROM plays 
                ${profileIdNum ? `WHERE "profileId" = :profileId` : ''}
                GROUP BY "trackId"
            ) p ON t.id = p."trackId"
            WHERE 1=1 ${searchCondition}
            ${orderBy}
            LIMIT :limit OFFSET :offset
        `

        const countQuery = `
            SELECT COUNT(*) as total
            FROM tracks t
            JOIN albums al ON t."albumId" = al.id
            JOIN artists ar ON al."artistId" = ar.id
            WHERE 1=1 ${searchCondition}
        `

        const tracks = await sequelize.query(tracksQuery, {
            type: QueryTypes.SELECT,
            replacements: {
                profileId: profileIdNum,
                limit: limitNum,
                offset: (pageNum - 1) * limitNum
            }
        })

        console.log('Tracks query debug:', {
            profileId: profileIdNum,
            profileIdType: typeof profileIdNum,
            foundTracks: tracks.length,
            firstTrackPlays: tracks[0] ? (tracks[0] as any).totalPlays : 'none'
        })

        const countResult = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT
        }) as any[]

        const totalCount = parseInt(countResult[0]?.total || '0')

        // Format the response
        const formattedTracks = tracks.map((track: any) => ({
            id: track.id,
            trackId: track.id.toString(),
            trackName: track.trackName,
            name: track.trackName, // Backward compatibility
            duration: track.duration,
            uri: track.uri,
            artistName: track.artistName,
            albumName: track.albumName,
            artist: {
                id: track.artistId,
                name: track.artistName
            },
            album: {
                id: track.albumId,
                name: track.albumName
            },
            totalPlays: parseInt(track.totalPlays) || 0,
            totalMinutes: parseFloat(track.totalMinutes) || 0,
            avgPlayDuration: parseFloat(track.avgPlayDuration) || 0,
            skipPercentage: parseFloat(track.skipPercentage) || 0,
            firstPlay: track.firstPlay || null,
            lastPlay: track.lastPlay || null,
            platforms: track.platforms || [],
            countries: track.countries || [],
            reasonStart: track.reasonStart || [],
            reasonEnd: track.reasonEnd || [],
            stats: {
                totalPlays: parseInt(track.totalPlays) || 0,
                totalMinutes: parseFloat(track.totalMinutes) || 0,
                avgPlayDuration: parseFloat(track.avgPlayDuration) || 0,
                skipPercentage: parseFloat(track.skipPercentage) || 0
            }
        }))

        res.json({
            success: true,
            data: formattedTracks,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
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
            order: [['timestamp', 'DESC']],
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
                    playedAt: (play as any).timestamp,
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
            order: [['timestamp', 'DESC']],
            limit: limitNum,
            offset: (pageNum - 1) * limitNum
        })

        res.json({
            success: true,
            data: plays.rows.map(play => ({
                id: play.id,
                playedAt: (play as any).timestamp,
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

// GET /api/tracks/:id/timeline - Timeline odtworzeń dla utworu (zoptymalizowany)
router.get('/:id/timeline', async (req, res) => {
    try {
        const { id: trackId } = req.params
        const { profileId } = req.query
        const profileIdNum = profileId ? parseInt(profileId as string, 10) : null

        // Build profile condition
        const profileCondition = profileIdNum ? `AND "profileId" = ${profileIdNum}` : ''

        // Complete timeline query - shows ALL activity from first to last play (or today)
        const timelineQuery = `
            WITH track_stats AS (
                SELECT 
                    MIN(timestamp)::date as first_play_date,
                    MAX(timestamp)::date as last_play_date,
                    COUNT(*) as total_plays
                FROM plays 
                WHERE "trackId" = $1 
                ${profileCondition}
            ),
            date_series AS (
                SELECT generate_series(
                    (SELECT first_play_date FROM track_stats),
                    GREATEST(
                        (SELECT last_play_date FROM track_stats),
                        CURRENT_DATE
                    ),
                    '1 day'::interval
                )::date as play_date
                FROM track_stats
                WHERE (SELECT total_plays FROM track_stats) > 0
            ),
            daily_plays AS (
                SELECT 
                    DATE(timestamp) as play_date,
                    COUNT(*) as daily_count,
                    SUM("msPlayed") as daily_ms
                FROM plays 
                WHERE "trackId" = $1 
                ${profileCondition}
                GROUP BY DATE(timestamp)
            )
            SELECT 
                ds.play_date as date,
                COALESCE(dp.daily_count, 0) as plays,
                ROUND((COALESCE(dp.daily_ms, 0) / 60000.0)::numeric, 1) as minutes
            FROM date_series ds
            LEFT JOIN daily_plays dp ON ds.play_date = dp.play_date
            ORDER BY ds.play_date ASC
        `

        const timeline = await sequelize.query(timelineQuery, {
            bind: [trackId],
            type: QueryTypes.SELECT,
            logging: false // Disable query logging for performance
        })

        const processedData = timeline.map(row => ({
            date: (row as any).date,
            plays: parseInt((row as any).plays as string),
            minutes: parseFloat((row as any).minutes as string) || 0
        })) // No need to reverse, already ordered ASC

        // Debug logging
        const totalTimelinePlays = processedData.reduce((sum, day) => sum + day.plays, 0)
        console.log(`Timeline for track ${trackId}: ${processedData.length} days, ${totalTimelinePlays} total plays`)

        // Set cache headers for 5 minutes - TYMCZASOWO WYŁĄCZONE
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        })

        res.json({
            success: true,
            data: processedData,
            count: processedData.length
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
