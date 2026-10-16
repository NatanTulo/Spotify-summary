import { scopeSql } from '../../middleware/dateScope.js'
import express, { Router } from 'express'
import { sequelize } from '../../config/database.js'
import { QueryTypes } from 'sequelize'
import { InvalidListQueryError, parseListQuery } from '../../utils/listQuery.js'
import { parseTrackFilters } from '../../utils/trackFilters.js'

const router: Router = express.Router()

// GET /api/albums - Lista albumów z filtrowaniem i paginacją
router.get('/', async (req, res) => {
    try {
        const { sortBy = 'plays' } = req.query
        const { pageNum, limitNum, profileIdNum, search, sortOrder } = parseListQuery(req.query)
        const filters = parseTrackFilters(req.query)
        const playConditions = [...filters.conditions]
        if (profileIdNum) playConditions.push('p."profileId" = :profileId')
        const replacements = { ...filters.replacements, search: `%${search}%`, profileId: profileIdNum }

        // Build WHERE clauses
        const searchCondition = search ? `
            AND (al.name ILIKE :search OR ar.name ILIKE :search)
        ` : ''

        const profileCondition = playConditions.length ? `AND ${playConditions.join(' AND ')}` : ''

        // Build ORDER BY clause
        let orderBy = ''
        switch (sortBy) {
            case 'name':
            case 'trackName':
                orderBy = `ORDER BY al.name ${sortOrder}`
                break
            case 'artist':
            case 'artistName':
                orderBy = `ORDER BY ar.name ${sortOrder}`
                break
            case 'minutes':
            case 'totalMinutes':
                orderBy = `ORDER BY total_ms_played ${sortOrder}`
                break
            case 'plays':
            default:
                orderBy = `ORDER BY plays ${sortOrder}`
        }

        const albumsQuery = `
            SELECT 
                al.id,
                al.name as "albumName",
                ar.name as "artistName",
                COUNT(p.id) as plays,
                COALESCE(SUM(p."msPlayed"), 0) as total_ms_played
            FROM albums al
            JOIN artists ar ON al."artistId" = ar.id
            JOIN tracks t ON t."albumId" = al.id
            LEFT JOIN plays p ON p."trackId" = t.id ${profileCondition}
            WHERE 1=1 ${searchCondition}
            GROUP BY al.id, al.name, ar.name
            HAVING COUNT(p.id) > 0 AND COUNT(p.id) >= :minPlays
            ${orderBy}
            LIMIT :limit OFFSET :offset
        `

        const countQuery = `
            SELECT COUNT(*) as total FROM (
            SELECT al.id
            FROM albums al
            JOIN artists ar ON al."artistId" = ar.id
            JOIN tracks t ON t."albumId" = al.id
            LEFT JOIN plays p ON p."trackId" = t.id ${profileCondition}
            WHERE 1=1 ${searchCondition}
            AND p.id IS NOT NULL
            GROUP BY al.id
            HAVING COUNT(p.id) >= :minPlays
            ) AS matching_albums
        `

        const albums = await sequelize.query(scopeSql(albumsQuery), {
            type: QueryTypes.SELECT,
            replacements: {
                ...replacements,
                limit: limitNum,
                offset: (pageNum - 1) * limitNum
            }
        })

        const countResult = await sequelize.query(scopeSql(countQuery), {
            type: QueryTypes.SELECT,
            replacements,
        }) as any[]

        const totalCount = parseInt(countResult[0]?.total || '0')

        const formattedAlbums = albums.map((album: any) => ({
            id: album.id,
            name: album.albumName,
            artist: album.artistName,
            plays: parseInt(album.plays),
            minutes: Math.round(parseInt(album.total_ms_played) / 60000)
        }))

        res.json({
            success: true,
            data: formattedAlbums,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalCount,
                pages: Math.ceil(totalCount / limitNum)
            }
        })

    } catch (error) {
        console.error('Error fetching albums:', error)
        res.status(error instanceof InvalidListQueryError ? 400 : 500).json({
            success: false,
            error: 'Failed to fetch albums',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
