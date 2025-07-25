import express from 'express'
import fs from 'fs'
import path from 'path'
import { Profile } from '../models/Profile.js'
import ImportProgressManager from '../utils/ImportProgressManager.js'
import { sequelize } from '../config/database.js'
import { QueryTypes } from 'sequelize'

const router = express.Router()

// GET /api/import/profiles - Lista zaimportowanych profili z bazy danych
router.get('/profiles', async (_req, res) => {
    try {
        const profiles = await Profile.findAll({
            order: [['createdAt', 'DESC']]
        })

        const formattedProfiles = profiles.map(profile => ({
            _id: profile.id.toString(),
            name: profile.name,
            username: profile.username,
            lastImport: profile.lastImport?.toISOString(),
            statistics: profile.statistics,
            createdAt: profile.createdAt.toISOString()
        }))

        res.json({
            success: true,
            data: formattedProfiles
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

// GET /api/import/available - Lista dostępnych profili do importu z folderu data
router.get('/available', async (_req, res) => {
    try {
        const dataDir = path.join(process.cwd(), '..', 'data')

        if (!fs.existsSync(dataDir)) {
            return res.json({
                success: true,
                data: []
            })
        }

        const profiles = fs.readdirSync(dataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const profilePath = path.join(dataDir, dirent.name)
                const files = fs.readdirSync(profilePath)
                const jsonFiles = files.filter(file =>
                    file.startsWith('Streaming_History_Audio_') && file.endsWith('.json')
                )

                return {
                    name: dirent.name,
                    path: profilePath,
                    files: jsonFiles,
                    fileCount: jsonFiles.length
                }
            })
            .filter(profile => profile.fileCount > 0)

        res.json({
            success: true,
            data: profiles
        })
    } catch (error) {
        console.error('Error reading available profiles:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to read available profiles',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/import/status - Status systemu importu
router.get('/status', async (_req, res) => {
    try {
        const dataDir = path.join(process.cwd(), '..', 'data')

        if (!fs.existsSync(dataDir)) {
            return res.json({
                success: true,
                data: {
                    hasData: false,
                    profiles: []
                }
            })
        }

        const profiles = fs.readdirSync(dataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const profilePath = path.join(dataDir, dirent.name)
                const files = fs.readdirSync(profilePath)
                const jsonFiles = files.filter(file =>
                    file.startsWith('Streaming_History_Audio_') && file.endsWith('.json')
                )

                return {
                    name: dirent.name,
                    files: jsonFiles,
                    fileCount: jsonFiles.length
                }
            })
            .filter(profile => profile.fileCount > 0)

        res.json({
            success: true,
            data: {
                hasData: profiles.length > 0,
                profiles: profiles
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

// GET /api/import/progress - Sprawdź wszystkie aktywne importy
router.get('/progress', async (_req, res) => {
    try {
        const progressManager = ImportProgressManager.getInstance()
        const allProgress = progressManager.getAllProgress()

        res.json({
            success: true,
            data: allProgress.map(progress => ({
                ...progress,
                percentage: progressManager.getProgressPercentage(progress.profileName)
            }))
        })
    } catch (error) {
        console.error('Error fetching all import progress:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch import progress',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// GET /api/import/progress/:profileName - Sprawdź postęp importu
router.get('/progress/:profileName', async (req, res) => {
    try {
        const { profileName } = req.params
        const progressManager = ImportProgressManager.getInstance()
        const progress = progressManager.getProgress(profileName)

        if (!progress) {
            return res.json({
                success: true,
                data: null
            })
        }

        const percentage = progressManager.getProgressPercentage(profileName)

        res.json({
            success: true,
            data: {
                ...progress,
                percentage
            }
        })
    } catch (error) {
        console.error('Error fetching import progress:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch import progress',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// POST /api/import/profile/:profileName - Importuj profil
router.post('/profile/:profileName', async (req, res) => {
    try {
        const { profileName } = req.params

        // Sprawdź czy profil istnieje w folderze data
        const dataDir = path.join(process.cwd(), '..', 'data')
        const profilePath = path.join(dataDir, profileName)

        if (!fs.existsSync(profilePath)) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            })
        }

        // Sprawdź czy import już nie jest w toku
        const progressManager = ImportProgressManager.getInstance()
        const existingProgress = progressManager.getProgress(profileName)

        if (existingProgress && existingProgress.isRunning) {
            return res.json({
                success: true,
                data: {
                    message: 'Import already in progress',
                    progress: existingProgress
                }
            })
        }

        // Sprawdź czy profil już istnieje w bazie
        let profile = await Profile.findOne({ where: { name: profileName } })

        if (!profile) {
            profile = await Profile.create({
                name: profileName,
                lastImport: new Date(),
                statistics: {
                    totalPlays: 0,
                    totalMinutes: 0,
                    uniqueTracks: 0,
                    uniqueArtists: 0,
                    uniqueAlbums: 0
                }
            })
        } else {
            // Aktualizuj lastImport
            profile.lastImport = new Date()
            await profile.save()
        }

        // Policz pliki JSON
        const files = fs.readdirSync(profilePath)
        const jsonFiles = files.filter(file =>
            file.startsWith('Streaming_History_Audio_') && file.endsWith('.json')
        )

        if (jsonFiles.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid streaming history files found'
            })
        }

        // Estymuj liczbę rekordów (średnio ~3000 rekordów na plik)
        const estimatedRecords = jsonFiles.length * 3000

        // Rozpocznij progress tracking
        progressManager.startImport(profileName, jsonFiles.length, estimatedRecords)

        // Uruchom import w tle
        setTimeout(async () => {
            try {
                // Dynamiczny import skryptu importData
                const { default: SpotifyDataImporter } = await import('../scripts/importData.js')
                const importer = new SpotifyDataImporter(dataDir, profileName)
                await importer.import()
            } catch (error) {
                console.error('Error during background import:', error)
                progressManager.errorImport(profileName, error instanceof Error ? error.message : 'Unknown error')
            }
        }, 100)

        res.json({
            success: true,
            data: {
                _id: profile.id.toString(),
                name: profile.name,
                lastImport: profile.lastImport?.toISOString(),
                statistics: profile.statistics,
                createdAt: profile.createdAt.toISOString(),
                importStarted: true,
                estimatedRecords
            }
        })
    } catch (error) {
        console.error('Error importing profile:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to import profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// POST /api/import/profile/:profileName/update-stats - Aktualizuj statystyki profilu
router.post('/profile/:profileName/update-stats', async (req, res) => {
    try {
        const { profileName } = req.params

        // Znajdź profil w bazie danych
        const profile = await Profile.findOne({ where: { name: profileName } })
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            })
        }

        console.log(`📊 Updating statistics for profile: ${profileName}`)

        // Policz statystyki dla profilu
        const [
            totalPlays,
            totalMsPlayed,
            uniqueTracks,
            uniqueArtists,
            uniqueAlbums
        ] = await Promise.all([
            sequelize.query(`SELECT COUNT(*) as count FROM plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`SELECT COALESCE(SUM("msPlayed"), 0) as sum FROM plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).sum)),
            sequelize.query(`SELECT COUNT(DISTINCT "trackId") as count FROM plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`
                SELECT COUNT(DISTINCT artists.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                JOIN artists ON albums."artistId" = artists.id
                WHERE plays."profileId" = :profileId
            `, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`
                SELECT COUNT(DISTINCT albums.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                WHERE plays."profileId" = :profileId
            `, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count))
        ])

        // Aktualizuj statystyki profilu
        await Profile.update({
            statistics: {
                totalPlays: totalPlays || 0,
                totalMinutes: Math.round((totalMsPlayed || 0) / 60000),
                uniqueTracks: uniqueTracks || 0,
                uniqueArtists: uniqueArtists || 0,
                uniqueAlbums: uniqueAlbums || 0
            },
            lastImport: new Date()
        }, {
            where: { id: profile.id }
        })

        // Pobierz zaktualizowany profil
        const updatedProfile = await Profile.findByPk(profile.id)

        console.log(`✅ Statistics updated for profile: ${profileName}`)
        console.log(`   - Total plays: ${totalPlays}`)
        console.log(`   - Total minutes: ${Math.round((totalMsPlayed || 0) / 60000)}`)
        console.log(`   - Unique tracks: ${uniqueTracks}`)
        console.log(`   - Unique artists: ${uniqueArtists}`)
        console.log(`   - Unique albums: ${uniqueAlbums}`)

        res.json({
            success: true,
            data: {
                _id: updatedProfile!.id.toString(),
                name: updatedProfile!.name,
                statistics: updatedProfile!.statistics,
                lastImport: updatedProfile!.lastImport?.toISOString()
            }
        })
    } catch (error) {
        console.error('Error updating profile statistics:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to update profile statistics',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// DELETE /api/import/clear - Usuń profil i wszystkie jego dane
router.delete('/clear', async (req, res) => {
    try {
        const { profileId } = req.query

        if (!profileId) {
            return res.status(400).json({
                success: false,
                error: 'Profile ID is required'
            })
        }

        const profile = await Profile.findByPk(profileId as string)

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Profile not found'
            })
        }

        // Usuń wszystkie powiązane dane używając raw SQL (szybsze dla dużych zbiorów)
        const transaction = await sequelize.transaction()

        try {
            // Usuń wszystkie powiązane tabele statystyk
            await sequelize.query(`
                DELETE FROM "yearly_stats" WHERE "profileId" = :profileId
            `, {
                replacements: { profileId },
                transaction
            })

            await sequelize.query(`
                DELETE FROM "daily_stats" WHERE "profileId" = :profileId
            `, {
                replacements: { profileId },
                transaction
            })

            await sequelize.query(`
                DELETE FROM "country_stats" WHERE "profileId" = :profileId
            `, {
                replacements: { profileId },
                transaction
            })

            await sequelize.query(`
                DELETE FROM "artist_stats" WHERE "profileId" = :profileId
            `, {
                replacements: { profileId },
                transaction
            })

            // Usuń wszystkie plays dla tego profilu
            await sequelize.query(`
                DELETE FROM plays WHERE "profileId" = :profileId
            `, {
                replacements: { profileId },
                transaction
            })

            // Usuń tracks, albums, artists które nie są używane przez inne profile
            // Najpierw tracks
            await sequelize.query(`
                DELETE FROM tracks WHERE id NOT IN (
                    SELECT DISTINCT "trackId" FROM plays WHERE "trackId" IS NOT NULL
                )
            `, { transaction })

            // Następnie albums
            await sequelize.query(`
                DELETE FROM albums WHERE id NOT IN (
                    SELECT DISTINCT "albumId" FROM tracks WHERE "albumId" IS NOT NULL
                )
            `, { transaction })

            // Na końcu artists
            await sequelize.query(`
                DELETE FROM artists WHERE id NOT IN (
                    SELECT DISTINCT "artistId" FROM albums WHERE "artistId" IS NOT NULL
                )
            `, { transaction })

            // Usuń profil
            await profile.destroy({ transaction })

            await transaction.commit()

            res.json({
                success: true,
                message: 'Profile and all associated data deleted successfully'
            })
        } catch (error) {
            await transaction.rollback()
            throw error
        }

    } catch (error) {
        console.error('Error clearing profile:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to clear profile',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// DELETE /api/import/clear-all - Usuń wszystkie dane z bazy (wszystkie profile)
router.delete('/clear-all', async (_req, res) => {
    try {
        console.log('Clearing all data from database...')

        const transaction = await sequelize.transaction()

        try {
            // Usuń wszystkie rekordy ze wszystkich tabel w odpowiedniej kolejności
            await sequelize.query('DELETE FROM "yearly_stats"', { transaction })
            await sequelize.query('DELETE FROM "daily_stats"', { transaction })
            await sequelize.query('DELETE FROM "country_stats"', { transaction })
            await sequelize.query('DELETE FROM "artist_stats"', { transaction })
            await sequelize.query('DELETE FROM "plays"', { transaction })
            await sequelize.query('DELETE FROM "tracks"', { transaction })
            await sequelize.query('DELETE FROM "albums"', { transaction })
            await sequelize.query('DELETE FROM "artists"', { transaction })
            await sequelize.query('DELETE FROM "profiles"', { transaction })

            await transaction.commit()

            console.log('All data cleared successfully')

            res.json({
                success: true,
                message: 'All data cleared successfully'
            })

        } catch (error) {
            await transaction.rollback()
            throw error
        }
    } catch (error) {
        console.error('Error clearing all data:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to clear all data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

// DEBUG endpoint - sprawdź surowe dane w bazie
router.get('/debug/data/:profileId', async (req, res) => {
    try {
        const { profileId } = req.params

        // Sprawdź ile rekordów play
        const [playsCount] = await sequelize.query(`
            SELECT COUNT(*) as count FROM plays WHERE "profileId" = :profileId
        `, {
            replacements: { profileId },
            type: QueryTypes.SELECT
        })

        // Sprawdź ile artystów
        const [artistsCount] = await sequelize.query(`
            SELECT COUNT(DISTINCT artists.id) as count 
            FROM plays 
            JOIN tracks ON plays."trackId" = tracks.id
            JOIN albums ON tracks."albumId" = albums.id  
            JOIN artists ON albums."artistId" = artists.id
            WHERE plays."profileId" = :profileId
        `, {
            replacements: { profileId },
            type: QueryTypes.SELECT
        })

        // Sprawdź profil
        const profile = await Profile.findByPk(profileId)

        res.json({
            success: true,
            data: {
                profileExists: !!profile,
                playsCount: (playsCount as any)?.count || 0,
                artistsCount: (artistsCount as any)?.count || 0,
                profileStats: profile?.statistics || null
            }
        })
    } catch (error) {
        console.error('Debug data error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get debug data',
            message: error instanceof Error ? error.message : 'Unknown error'
        })
    }
})

export default router
