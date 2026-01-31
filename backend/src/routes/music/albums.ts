import express, { Router } from 'express'
import { sequelize } from '../../config/database.js'
import { QueryTypes } from 'sequelize'

const router: Router = express.Router()

// GET /api/albums - Lista albumów z filtrowaniem i paginacją
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            sortBy = 'plays',
            sortOrder = 'DESC',
            profileId
        } = req.query

        const pageNum = parseInt(page as string, 10)
        const limitNum = parseInt(limit as string, 10)
        const profileIdNum = profileId && profileId !== 'all' ? parseInt(profileId as string, 10) : null

        // Build WHERE clauses
        const searchCondition = search ? `
            AND (al.name ILIKE '%${search}%' OR ar.name ILIKE '%${search}%')
        ` : ''

        const profileCondition = profileIdNum ? `AND p."profileId" = :profileId` : ''

        // Build ORDER BY clause
        let orderBy = ''
        switch (sortBy) {
            case 'name':
                orderBy = `ORDER BY al.name ${sortOrder}`
                break
            case 'artist':
                orderBy = `ORDER BY ar.name ${sortOrder}`
                break
            case 'minutes':
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
            HAVING COUNT(p.id) > 0
            ${orderBy}
            LIMIT :limit OFFSET :offset
        `

        const countQuery = `
            SELECT COUNT(DISTINCT al.id) as total
            FROM albums al
            JOIN artists ar ON al."artistId" = ar.id
            JOIN tracks t ON t."albumId" = al.id
            LEFT JOIN plays p ON p."trackId" = t.id ${profileCondition}
            WHERE 1=1 ${searchCondition}
            AND p.id IS NOT NULL
        `

        const albums = await sequelize.query(albumsQuery, {
            type: QueryTypes.SELECT,
            replacements: {
                profileId: profileIdNum,
                limit: limitNum,
                offset: (pageNum - 1) * limitNum
            }
        })

        const countResult = await sequelize.query(countQuery, {
            type: QueryTypes.SELECT,
            replacements: {
                profileId: profileIdNum
            }
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
        res.status(500).json({
            success: false,
            error: 'Failed to fetch albums',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
