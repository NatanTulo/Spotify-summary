import express from 'express'

const router = express.Router()

router.get('/profiles', (_req, res) => {
    res.json({
        success: true,
        data: []
    })
})

export default router
