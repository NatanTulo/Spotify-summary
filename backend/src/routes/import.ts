import express, { Router } from 'express'
import * as ImportController from '../controllers/import/importController.js'
import * as ProfileController from '../controllers/import/profileController.js'

const router: Router = express.Router()

// Profile Management
router.get('/profiles', ProfileController.getProfiles)
router.post('/profile/:profileName/update-stats', ProfileController.updateStats)
router.delete('/clear', ProfileController.deleteProfile)
router.delete('/clear-all', ProfileController.clearAll)

// Import Process
router.get('/available', ImportController.getAvailable)
router.get('/status', ImportController.getStatus)
router.get('/progress', ImportController.getAllProgress)
router.get('/progress/:profileName', ImportController.getProgress)
router.post('/profile/:profileName', ImportController.startImport)

// Debug
router.get('/debug/data/:profileId', ProfileController.getDebugData)

export default router
