import express from 'express'
import { sequelize } from '../config/database.js'
import { QueryTypes } from 'sequelize'

const router = express.Router()

// GET /api/artists/top - Top artyści według liczby odtworzeń
router.get('/top', async (req, res) => {
    try {
        const { profileId, limit = 10 } = req.query

        // Jeśli profileId = 'all' lub brak profileId, agreguj wszystkie profile
        // Jeśli jest konkretny profileId, filtruj po nim
        const whereClause = profileId && profileId !== 'all' ? 'WHERE plays."profileId" = :profileId' : ''
        const replacements = profileId && profileId !== 'all' ? { profileId, limit: parseInt(limit as string) } : { limit: parseInt(limit as string) }

        const topArtists = await sequelize.query(`
            SELECT 
                artists.id,
                artists.name,
                COUNT(plays.id) as plays,
                SUM(plays."msPlayed") as total_ms_played
            FROM plays
            JOIN tracks ON plays."trackId" = tracks.id
            JOIN albums ON tracks."albumId" = albums.id  
            JOIN artists ON albums."artistId" = artists.id
            ${whereClause}
            GROUP BY artists.id, artists.name
            ORDER BY COUNT(plays.id) DESC
            LIMIT :limit
        `, {
            replacements,
            type: QueryTypes.SELECT
        })

        const formattedArtists = (topArtists as any[]).map(artist => ({
            id: artist.id,
            name: artist.name,
            plays: parseInt(artist.plays),
            minutes: Math.round(parseInt(artist.total_ms_played) / 60000)
        }))

        res.json({
            success: true,
            data: formattedArtists
        })
    } catch (error) {
        console.error('Error fetching top artists:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top artists'
        })
    }
})

export default router
