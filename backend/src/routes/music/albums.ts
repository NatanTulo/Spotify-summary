import express, { Router } from 'express'

const router: Router = express.Router()

router.get('/top', (_req, res) => {
    res.json({
        success: true,
        data: []
    })
})

export default router
