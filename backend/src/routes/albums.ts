import express from 'express'

const router = express.Router()

router.get('/top', (_req, res) => {
    res.json({
        success: true,
        data: []
    })
})

export default router
