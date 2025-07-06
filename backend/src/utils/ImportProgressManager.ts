// Import Progress Manager
interface ImportProgress {
    profileName: string
    isRunning: boolean
    currentFile: string
    currentFileIndex: number
    totalFiles: number
    currentRecord: number
    totalRecordsInFile: number
    completedFiles: number
    totalRecordsProcessed: number
    estimatedTotalRecords: number
    startTime: Date
    lastUpdate: Date
    status: 'preparing' | 'importing' | 'completed' | 'error' | 'cancelled'
    error?: string
    stats: {
        filesProcessed: number
        totalRecords: number
        artistsCreated: number
        albumsCreated: number
        tracksCreated: number
        playsCreated: number
        skippedRecords: number
        currentStats?: {
            totalPlays: number
            totalMinutes: number
            uniqueTracks: number
            uniqueArtists: number
            uniqueAlbums: number
        }
    }
}

class ImportProgressManager {
    private static instance: ImportProgressManager
    private progressMap: Map<string, ImportProgress> = new Map()

    static getInstance(): ImportProgressManager {
        if (!ImportProgressManager.instance) {
            ImportProgressManager.instance = new ImportProgressManager()
        }
        return ImportProgressManager.instance
    }

    startImport(profileName: string, totalFiles: number, estimatedTotalRecords: number): void {
        this.progressMap.set(profileName, {
            profileName,
            isRunning: true,
            currentFile: '',
            currentFileIndex: 0,
            totalFiles,
            currentRecord: 0,
            totalRecordsInFile: 0,
            completedFiles: 0,
            totalRecordsProcessed: 0,
            estimatedTotalRecords,
            startTime: new Date(),
            lastUpdate: new Date(),
            status: 'preparing',
            stats: {
                filesProcessed: 0,
                totalRecords: 0,
                artistsCreated: 0,
                albumsCreated: 0,
                tracksCreated: 0,
                playsCreated: 0,
                skippedRecords: 0
            }
        })
    }

    updateFileProgress(profileName: string, fileName: string, fileIndex: number, currentRecord: number, totalRecordsInFile: number): void {
        const progress = this.progressMap.get(profileName)
        if (progress) {
            progress.currentFile = fileName
            progress.currentFileIndex = fileIndex
            progress.currentRecord = currentRecord
            progress.totalRecordsInFile = totalRecordsInFile
            progress.lastUpdate = new Date()
            progress.status = 'importing'
        }
    }

    completeFile(profileName: string): void {
        const progress = this.progressMap.get(profileName)
        if (progress) {
            progress.completedFiles++
            progress.totalRecordsProcessed += progress.totalRecordsInFile
            progress.lastUpdate = new Date()
        }
    }

    updateStats(profileName: string, stats: any): void {
        const progress = this.progressMap.get(profileName)
        if (progress) {
            progress.stats = { ...stats }
            progress.lastUpdate = new Date()
        }
    }

    completeImport(profileName: string): void {
        const progress = this.progressMap.get(profileName)
        if (progress) {
            progress.isRunning = false
            progress.status = 'completed'
            progress.lastUpdate = new Date()
        }
    }

    errorImport(profileName: string, error: string): void {
        const progress = this.progressMap.get(profileName)
        if (progress) {
            progress.isRunning = false
            progress.status = 'error'
            progress.error = error
            progress.lastUpdate = new Date()
        }
    }

    cancelImport(profileName: string): void {
        const progress = this.progressMap.get(profileName)
        if (progress) {
            progress.isRunning = false
            progress.status = 'cancelled'
            progress.lastUpdate = new Date()
        }
    }

    getProgress(profileName: string): ImportProgress | undefined {
        return this.progressMap.get(profileName)
    }

    getAllProgress(): ImportProgress[] {
        return Array.from(this.progressMap.values())
    }

    clearProgress(profileName: string): void {
        this.progressMap.delete(profileName)
    }

    getProgressPercentage(profileName: string): number {
        const progress = this.progressMap.get(profileName)
        if (!progress) return 0

        if (progress.status === 'completed') return 100
        if (progress.estimatedTotalRecords === 0) return 0

        const completedRecords = progress.totalRecordsProcessed + progress.currentRecord
        return Math.min(100, Math.round((completedRecords / progress.estimatedTotalRecords) * 100))
    }
}

export default ImportProgressManager
export type { ImportProgress }
