import { Router } from 'express'
import { Audiobook, AudiobookPlay, Profile } from '../../models/index.js'
import { Op } from 'sequelize'

const router = Router()

// Get all audiobooks for a profile
router.get('/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params
        const { page = 1, limit = 20, search } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const offset = (pageNum - 1) * limitNum

        const whereCondition: any = {}
        if (search) {
            whereCondition[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { author: { [Op.iLike]: `%${search}%` } }
            ]
        }

        // If profileId is 'all', get audiobooks for all profiles
        const includeCondition: any = {
            model: AudiobookPlay,
            required: true,
            attributes: []
        }
        
        if (profileId !== 'all') {
            includeCondition.where = { profileId: parseInt(profileId) }
        }

        const audiobooks = await Audiobook.findAndCountAll({
            include: [includeCondition],
            where: whereCondition,
            distinct: true,
            limit: limitNum,
            offset,
            order: [['createdAt', 'DESC']]
        })

        // Always return 200 with data, even if empty
        res.json({
            success: true,
            data: {
                audiobooks: audiobooks.rows,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(audiobooks.count / limitNum),
                    total: audiobooks.count
                },
                isEmpty: audiobooks.count === 0
            }
        })
    } catch (error) {
        console.error('Error fetching audiobooks:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audiobooks'
        })
    }
})

// Get audiobook plays for a specific audiobook and profile
router.get('/:profileId/audiobook/:audiobookId/plays', async (req, res) => {
    try {
        const { profileId, audiobookId } = req.params
        const { page = 1, limit = 50 } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const offset = (pageNum - 1) * limitNum

        const whereCondition: any = {
            audiobookId: parseInt(audiobookId)
        }
        
        // If profileId is not 'all', add profileId filter
        if (profileId !== 'all') {
            whereCondition.profileId = parseInt(profileId)
        }

        const plays = await AudiobookPlay.findAndCountAll({
            where: whereCondition,
            include: [{
                model: Audiobook,
                attributes: ['name', 'spotifyUri']
            }, {
                model: Profile,
                attributes: ['name']
            }],
            limit: limitNum,
            offset,
            order: [['timestamp', 'DESC']]
        })

        res.json({
            success: true,
            data: {
                plays: plays.rows,
                pagination: {
                    current: pageNum,
                    pages: Math.ceil(plays.count / limitNum),
                    total: plays.count
                }
            }
        })
    } catch (error) {
        console.error('Error fetching audiobook plays:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audiobook plays'
        })
    }
})

export default router
