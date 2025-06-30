import express from 'express'
import fs from 'fs'
import path from 'path'
import SpotifyDataImporter from '../scripts/importData.js'
import { Artist } from '../models/Artist.js'
import { Album } from '../models/Album.js'
import { Track } from '../models/Track.js'
import { Play } from '../models/Play.js'
import { Profile } from '../models/Profile.js'
import ImportProgressManager from '../utils/ImportProgressManager.js'
import mongoose from 'mongoose'

const router = express.Router()

// GET /api/import/status - Sprawdzenie statusu danych
router.get('/status', async (_req, res) => {
    try {
        const [artistCount, albumCount, trackCount, playCount] = await Promise.all([
            Artist.countDocuments(),
            Album.countDocuments(),
            Track.countDocuments(),
            Play.countDocuments()
        ])

        // Sprawdź dostępne profile w folderze data
        const dataDir = path.join(process.cwd(), '../data')
        const profiles: Array<{ name: string, files: Array<{ name: string, size: number, modified: Date }> }> = []

        if (fs.existsSync(dataDir)) {
            const entries = fs.readdirSync(dataDir, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const profileDir = path.join(dataDir, entry.name)
                    const jsonFiles = fs.readdirSync(profileDir)
                        .filter(file => file.endsWith('.json'))
                        .map(file => ({
                            name: file,
                            size: fs.statSync(path.join(profileDir, file)).size,
                            modified: fs.statSync(path.join(profileDir, file)).mtime
                        }))

                    if (jsonFiles.length > 0) {
                        profiles.push({
                            name: entry.name,
                            files: jsonFiles
                        })
                    }
                }
            }
        }

        res.json({
            success: true,
            data: {
                hasData: playCount > 0,
                statistics: {
                    artists: artistCount,
                    albums: albumCount,
                    tracks: trackCount,
                    plays: playCount
                },
                profiles,
                dataDirectory: dataDir
            }
        })

    } catch (error) {
        console.error('Error checking import status:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to check import status',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// POST /api/import/start - Rozpoczęcie importu
router.post('/start', async (req, res) => {
    try {
        const { dataPath } = req.body
        const finalDataPath = dataPath || path.join(process.cwd(), '../data')

        // Sprawdź czy folder istnieje
        if (!fs.existsSync(finalDataPath)) {
            return res.status(400).json({
                success: false,
                error: 'Data directory does not exist',
                path: finalDataPath
            })
        }

        // Sprawdź czy są pliki JSON
        const jsonFiles = fs.readdirSync(finalDataPath).filter(file => file.endsWith('.json'))

        if (jsonFiles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No JSON files found in directory',
                path: finalDataPath
            })
        }

        // Rozpocznij import (w tle)
        res.json({
            success: true,
            message: 'Import started',
            data: {
                filesFound: jsonFiles.length,
                dataPath: finalDataPath
            }
        })

        // Import w tle
        const importer = new SpotifyDataImporter('../data')
        importer.import()
            .then(() => {
                console.log('✅ Import completed successfully')
            })
            .catch((error: any) => {
                console.error('❌ Import failed:', error)
            })

    } catch (error) {
        console.error('Error starting import:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to start import',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// POST /api/import/profile/:profileName - Import danych dla konkretnego profilu
router.post('/profile/:profileName', async (req, res) => {
    try {
        const { profileName } = req.params

        if (!profileName || profileName.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Profile name is required'
            })
        }

        res.json({
            success: true,
            message: `Import started for profile: ${profileName}`,
            profileName
        })

        // Import w tle dla konkretnego profilu - nie czekamy na ukończenie
        setImmediate(async () => {
            try {
                const importer = new SpotifyDataImporter('../data', profileName)
                await importer.import()
                console.log(`✅ Import completed successfully for profile: ${profileName}`)
            } catch (error: any) {
                console.error(`❌ Import failed for profile ${profileName}:`, error)
            }
        })

    } catch (error) {
        console.error('Error starting profile import:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to start profile import',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/import/profiles - Lista dostępnych profili
router.get('/profiles', async (_req, res) => {
    try {
        const profiles = await Profile.find({}, {
            name: 1,
            username: 1,
            lastImport: 1,
            statistics: 1,
            createdAt: 1
        }).sort({ lastImport: -1 })

        res.json({
            success: true,
            data: profiles
        })

    } catch (error) {
        console.error('Error fetching profiles:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profiles',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// DELETE /api/import/clear - Wyczyszczenie danych
router.delete('/clear', async (req, res) => {
    try {
        const { profileId } = req.query

        if (profileId) {
            // Usuń dane konkretnego profilu
            await Promise.all([
                Play.deleteMany({ profileId }),
                Profile.findByIdAndDelete(profileId)
            ])

            res.json({
                success: true,
                message: `Profile data cleared successfully`
            })
        } else {
            // Usuń wszystkie dane
            await Promise.all([
                Play.deleteMany({}),
                Track.deleteMany({}),
                Album.deleteMany({}),
                Artist.deleteMany({}),
                Profile.deleteMany({})
            ])

            res.json({
                success: true,
                message: 'All data cleared successfully'
            })
        }

    } catch (error) {
        console.error('Error clearing data:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to clear data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/import/progress - Sprawdzenie progress importu
router.get('/progress', async (req, res) => {
    try {
        const { profileName } = req.query
        const progressManager = ImportProgressManager.getInstance()

        if (profileName && typeof profileName === 'string') {
            const progress = progressManager.getProgress(profileName)
            if (!progress) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'No import in progress for this profile'
                })
            }

            res.json({
                success: true,
                data: {
                    ...progress,
                    percentage: progressManager.getProgressPercentage(profileName)
                }
            })
        } else {
            // Zwróć progress wszystkich importów
            const allProgress = progressManager.getAllProgress()
            res.json({
                success: true,
                data: allProgress.map(progress => ({
                    ...progress,
                    percentage: progressManager.getProgressPercentage(progress.profileName)
                }))
            })
        }
    } catch (error) {
        console.error('Error getting import progress:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get import progress',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// DELETE /api/import/progress/:profileName - Anuluj import
router.delete('/progress/:profileName', async (req, res) => {
    try {
        const { profileName } = req.params
        const progressManager = ImportProgressManager.getInstance()

        progressManager.cancelImport(profileName)

        res.json({
            success: true,
            message: `Import cancelled for profile: ${profileName}`
        })
    } catch (error) {
        console.error('Error cancelling import:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to cancel import',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// DELETE /api/import/clear - Usuń dane profilu
router.delete('/clear', async (req, res) => {
    try {
        const { profileId } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                error: 'Profile ID is required'
            })
        }

        // Użyj mongoose ObjectId
        const objectId = new mongoose.Types.ObjectId(profileId as string)

        // Usuń dane profilu i zagregowane statystyki
        await Promise.all([
            Play.deleteMany({ profileId: objectId }),
            Profile.findByIdAndDelete(objectId),
            // Dodaj usuwanie zagregowanych statystyk gdy będą dostępne
        ])

        res.json({
            success: true,
            message: `Profile data cleared successfully`
        })

    } catch (error) {
        console.error('Error clearing profile data:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to clear profile data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
