import fs from 'fs'
import path from 'path'
import ImportProgressManager from '../utils/ImportProgressManager.js'
import ProfileService from './profileService.js'

export class ImportService {
    private getDataDir() {
        return path.join(process.cwd(), '..', 'data')
    }

    getAvailableProfiles() {
        const dataDir = this.getDataDir()

        if (!fs.existsSync(dataDir)) {
            return []
        }

        return fs.readdirSync(dataDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const profilePath = path.join(dataDir, dirent.name)
                const files = fs.readdirSync(profilePath)
                const audioFiles = files.filter(file =>
                    file.startsWith('Streaming_History_Audio_') && file.endsWith('.json')
                )
                const videoFiles = files.filter(file =>
                    file.startsWith('Streaming_History_Video_') && file.endsWith('.json')
                )

                return {
                    name: dirent.name,
                    path: profilePath,
                    files: [...audioFiles, ...videoFiles],
                    audioFiles: audioFiles.length,
                    videoFiles: videoFiles.length,
                    fileCount: audioFiles.length + videoFiles.length
                }
            })
            .filter(profile => profile.fileCount > 0)
    }

    getImportStatus() {
        const profiles = this.getAvailableProfiles()
        return {
            hasData: profiles.length > 0,
            profiles
        }
    }

    getAllProgress() {
        const progressManager = ImportProgressManager.getInstance()
        const allProgress = progressManager.getAllProgress()
        return allProgress.map(progress => ({
            ...progress,
            percentage: progressManager.getProgressPercentage(progress.profileName)
        }))
    }

    getProgress(profileName: string) {
        const progressManager = ImportProgressManager.getInstance()
        const progress = progressManager.getProgress(profileName)

        if (!progress) return null

        return {
            ...progress,
            percentage: progressManager.getProgressPercentage(profileName)
        }
    }

    async startImport(profileName: string) {
        const dataDir = this.getDataDir()
        const profilePath = path.join(dataDir, profileName)

        if (!fs.existsSync(profilePath)) {
            throw new Error('Profile not found')
        }

        const progressManager = ImportProgressManager.getInstance()
        const existingProgress = progressManager.getProgress(profileName)

        if (existingProgress && existingProgress.isRunning) {
            return {
                message: 'Import already in progress',
                progress: existingProgress,
                alreadyRunning: true
            }
        }

        // Create or update profile metadata
        const profile = await ProfileService.createOrUpdateProfile(profileName)

        // Count files
        const files = fs.readdirSync(profilePath)
        const jsonFiles = files.filter(file =>
            (file.startsWith('Streaming_History_Audio_') || file.startsWith('Streaming_History_Video_'))
            && file.endsWith('.json')
        )

        if (jsonFiles.length === 0) {
            throw new Error('No valid streaming history files found')
        }

        const estimatedRecords = jsonFiles.length * 3000
        progressManager.startImport(profileName, jsonFiles.length, estimatedRecords)

        // Run import in background
        setTimeout(async () => {
            try {
                const { default: SpotifyDataImporter } = await import('../scripts/importData.js')
                const importer = new SpotifyDataImporter(dataDir, profileName)
                await importer.import()
            } catch (error) {
                console.error('Error during background import:', error)
                progressManager.errorImport(profileName, error instanceof Error ? error.message : 'Unknown error')
            }
        }, 100)

        return {
            _id: profile.id.toString(),
            name: profile.name,
            lastImport: profile.lastImport?.toISOString(),
            statistics: profile.statistics,
            createdAt: profile.createdAt.toISOString(),
            importStarted: true,
            estimatedRecords,
            alreadyRunning: false
        }
    }
}

export default new ImportService()
