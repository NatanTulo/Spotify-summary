import { readHistory, validateRecord, ImportCancelledError } from './readHistory.js'
import type { Transaction } from 'sequelize'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'node:url'
import dotenv from 'dotenv'
import { connectDB, sequelize } from '../config/database.js'
import { QueryTypes } from 'sequelize'
import { Play } from '../models/music/Play.js'
import { Profile } from '../models/common/Profile.js'
import { PodcastPlay } from '../models/podcasts/PodcastPlay.js'
import { AudiobookPlay } from '../models/audiobooks/AudiobookPlay.js'
import ImportProgressManager from '../utils/ImportProgressManager.js'
import { StatsAggregator } from '../utils/StatsAggregator.js'
import { SpotifyPlayData, ImportStats } from './importers/types.js'
import { MusicImporter } from './importers/MusicImporter.js'
import { PodcastImporter } from './importers/PodcastImporter.js'
import { AudiobookImporter } from './importers/AudiobookImporter.js'

dotenv.config()

class SpotifyDataImporter {
    private transaction?: Transaction
    private dataDir: string
    private profileName?: string
    private profileId?: number
    private stats: ImportStats = {
        filesProcessed: 0,
        totalRecords: 0,
        artistsCreated: 0,
        albumsCreated: 0,
        tracksCreated: 0,
        playsCreated: 0,
        showsCreated: 0,
        episodesCreated: 0,
        podcastPlaysCreated: 0,
        audiobooksCreated: 0,
        audiobookPlaysCreated: 0,
        skippedRecords: 0,
        skippedReasons: {
            underThreshold: 0,
            missingFieldsMusic: 0,
            missingFieldsPodcast: 0,
            missingFieldsAudiobook: 0,
            unknownType: 0,
            errors: 0
        } as Record<string, number>
    }

    private progressManager: ImportProgressManager
    private musicImporter!: MusicImporter
    private podcastImporter!: PodcastImporter
    private audiobookImporter!: AudiobookImporter

    constructor(dataDir: string = '../data', profileName?: string) {
        this.dataDir = path.resolve(dataDir)
        this.profileName = profileName
        this.progressManager = ImportProgressManager.getInstance()

        // Jeśli podano nazwę profilu, użyj folderu profilu
        if (profileName) {
            if (path.basename(profileName) !== profileName || profileName === '.' || profileName === '..') throw new Error('Invalid profile name')
            this.dataDir = path.join(this.dataDir, profileName)
        } else {
            // Sprawdź czy istnieje subfolder "Spotify Extended Streaming History"
            const spotifySubfolder = path.join(this.dataDir, 'Spotify Extended Streaming History')
            if (fs.existsSync(spotifySubfolder)) {
                this.dataDir = spotifySubfolder
                console.log(`📁 Using Spotify subfolder: ${this.dataDir}`)
            }
        }
    }

    private initializeImporters() {
        if (!this.profileId) throw new Error("Profile ID not set");
        this.musicImporter = new MusicImporter(this.stats, this.profileId, this.transaction);
        this.podcastImporter = new PodcastImporter(this.stats, this.profileId, this.transaction);
        this.audiobookImporter = new AudiobookImporter(this.stats, this.profileId, this.transaction);
    }

    async import(): Promise<void> {
        try {
            console.log('🚀 Starting Spotify data import...')
            console.log(`📁 Data directory: ${this.dataDir}`)
            if (this.profileName) {
                console.log(`👤 Profile: ${this.profileName}`)
            }

            await connectDB()
            console.log('✅ Connected to PostgreSQL')

            const files = this.findJsonFiles()
            if (!files.length) throw new Error('No JSON files found in data directory')
            this.checkCancelled()
            const estimatedTotal = await this.estimateTotalRecords(files)
            this.checkCancelled()
            if (this.profileName) this.progressManager.startImport(this.profileName, files.length, estimatedTotal)
            await sequelize.transaction(async transaction => {
                this.transaction = transaction
                // Serialize imports sharing artist/track dimensions. Readers retain the old committed history.
                await sequelize.query('SELECT pg_advisory_xact_lock(187042601)', { transaction })
                this.checkCancelled()
                await this.getOrCreateProfile()
                this.initializeImporters()
                await this.clearExistingData()
                for (let i = 0; i < files.length; i++) {
                    await this.processFileWithProgress(files[i], i)
                    if (this.profileName) this.progressManager.completeFile(this.profileName)
                }
                this.checkCancelled()
                await this.updateProfileStatistics()
                await new StatsAggregator(this.profileId!, transaction).aggregateAllStats()
                this.checkCancelled()
                await sequelize.query('ANALYZE plays, podcast_plays, audiobook_plays', { transaction })
            })
            this.transaction = undefined

            // Zakończ śledzenie progress
            if (this.profileName) {
                this.progressManager.updateStats(this.profileName, this.stats)
                this.progressManager.completeImport(this.profileName)
            }

            console.log('\n✅ Import completed successfully!')
            this.printStats()

        } catch (error) {
            console.error('❌ Import failed:', error)
            if (this.profileName) {
                if (error instanceof ImportCancelledError) this.progressManager.finishCancellation(this.profileName)
                else this.progressManager.errorImport(this.profileName, error instanceof Error ? error.message : 'Unknown error')
            }
            throw error
        }
    }

    /**
     * Tworzy lub pobiera profil
     */
    private async getOrCreateProfile(): Promise<void> {
        if (!this.profileName) {
            throw new Error('Profile name is required')
        }

        let profile = await Profile.findOne({ transaction: this.transaction, where: { name: this.profileName } })

        if (!profile) {
            profile = await Profile.create({
                name: this.profileName,
                statistics: {
                    totalPlays: 0,
                    totalMinutes: 0,
                    uniqueTracks: 0,
                    uniqueArtists: 0,
                    uniqueAlbums: 0,
                    totalPodcastPlays: 0,
                    totalAudiobookPlays: 0,
                    uniqueShows: 0,
                    uniqueEpisodes: 0,
                    uniqueAudiobooks: 0
                },
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction: this.transaction })
            console.log(`✅ Created new profile: ${this.profileName}`)
        } else {
            console.log(`📋 Using existing profile: ${this.profileName}`)
        }

        this.profileId = profile.id
    }

    /**
     * Czyści istniejące dane dla profilu
     */
    private async clearExistingData(): Promise<void> {
        if (!this.profileId) return

        console.log('🗑️ Clearing existing data for profile...')
        await Promise.all([
            Play.destroy({ transaction: this.transaction, where: { profileId: this.profileId } }),
            PodcastPlay.destroy({ transaction: this.transaction, where: { profileId: this.profileId } }),
            AudiobookPlay.destroy({ transaction: this.transaction, where: { profileId: this.profileId } })
        ])
        console.log('✅ Existing data cleared')
    }

    /**
     * Znajdź wszystkie pliki JSON
     */
    private findJsonFiles(): string[] {
        if (!fs.existsSync(this.dataDir)) {
            return []
        }

        return fs.readdirSync(this.dataDir)
            .filter(file => file.endsWith('.json') && 
                   (file.includes('Streaming_History_Audio') || file.includes('Streaming_History_Video')))
            .filter(file => path.dirname(fs.realpathSync(path.join(this.dataDir, file))) === fs.realpathSync(this.dataDir))
            .sort()
    }

    /**
     * Szacuj całkowitą liczbę rekordów
     */
    private async estimateTotalRecords(files: string[]): Promise<number> {
        let total = 0
        for (const file of files) {
            for await (const record of readHistory(path.join(this.dataDir, file))) {
                validateRecord(record)
                total++
                this.checkCancelled()
            }
        }
        return total
    }

    private checkCancelled(): void {
        if (this.profileName && this.progressManager.getProgress(this.profileName)?.status === 'cancelled') throw new ImportCancelledError()
    }

    private async processFileWithProgress(file: string, index: number): Promise<void> {
        let batch: SpotifyPlayData[] = []
        let processed = 0
        for await (const record of readHistory(path.join(this.dataDir, file))) {
            validateRecord(record)
            batch.push(record)
            if (batch.length === 1000) {
                await this.processBatch(batch)
                processed += batch.length
                batch = []
                if (this.profileName) this.progressManager.updateFileProgress(this.profileName, file, index, processed, processed)
            }
        }
        await this.processBatch(batch)
        processed += batch.length
        this.stats.filesProcessed++
        this.stats.totalRecords += processed
        if (this.profileName) this.progressManager.updateFileProgress(this.profileName, file, index, processed, processed)
        await this.updateRealTimeStats()
    }

    private async processBatch(batch: SpotifyPlayData[]): Promise<void> {
        this.checkCancelled()
        for (const record of batch) {
            this.checkCancelled()
            await this.processRecord(record)
        }
        await this.musicImporter.flush()
        await this.podcastImporter.flush()
        await this.audiobookImporter.flush()
        this.checkCancelled()
    }

    /**
     * Przetwórz pojedynczy rekord
     */
    private async processRecord(record: SpotifyPlayData): Promise<void> {
        // Kategorizuj typ treści na podstawie zawartości JSON
        const contentType = this.categorizeContent(record)
        
        switch (contentType) {
            case 'music':
                return this.musicImporter.processRecord(record);
            case 'podcast':
                return this.podcastImporter.processRecord(record);
            case 'audiobook':
                return this.audiobookImporter.processRecord(record);
            default:
                console.warn('Unknown content type, skipping record:', {
                    track: record.master_metadata_track_name,
                    episode: record.episode_name,
                    audiobook: record.audiobook_title
                })
                this.stats.skippedRecords++
                this.incrementSkip('unknownType')
        }
    }

    /**
     * Kategoryzuj typ treści na podstawie dostępnych pól JSON
     */
    private categorizeContent(record: SpotifyPlayData): 'music' | 'podcast' | 'audiobook' | 'unknown' {
        // Podcast/video: obecność pól podcastowych LUB URI odcinka
        if (
            (record.episode_name && record.episode_name !== null) ||
            (record.episode_show_name && record.episode_show_name !== null) ||
            (record.spotify_episode_uri && record.spotify_episode_uri !== null)
        ) {
            return 'podcast'
        }

        // Muzyka: nazwa utworu LUB obecność spotify_track_uri
        if (
            (record.master_metadata_track_name && record.master_metadata_track_name !== null) ||
            (record.spotify_track_uri && record.spotify_track_uri !== null)
        ) {
            return 'music'
        }

        // Audiobook: tytuł lub URI
        if (
            (record.audiobook_title && record.audiobook_title !== null) ||
            (record.audiobook_uri && record.audiobook_uri !== null)
        ) {
            return 'audiobook'
        }

        return 'unknown'
    }

    private incrementSkip(reason: string) {
        this.stats.skippedReasons[reason] = (this.stats.skippedReasons[reason] || 0) + 1
    }

    /**
     * Aktualizuj statystyki profilu
     */
    private async updateProfileStatistics(): Promise<void> {
        if (!this.profileId) return

        console.log('\n📊 Updating profile statistics...')

        const [
            totalPlays,
            totalMsPlayed,
            uniqueTracks,
            uniqueArtists,
            uniqueAlbums,
            // Podcast stats
            totalPodcastPlays,
            uniqueShows,
            uniqueEpisodes
        ] = await Promise.all([
            Play.count({ transaction: this.transaction, where: { profileId: this.profileId } }),
            Play.sum('msPlayed', { transaction: this.transaction, where: { profileId: this.profileId } }),
            Play.count({ transaction: this.transaction,
                where: { profileId: this.profileId },
                distinct: true,
                col: 'trackId'
            }),
            // Policz unikalnych artystów
            sequelize.query(`
                SELECT COUNT(DISTINCT artists.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                JOIN artists ON albums."artistId" = artists.id
                WHERE plays."profileId" = :profileId
            `, { transaction: this.transaction,
                replacements: { profileId: this.profileId },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as { count: string }).count)),
            // Policz unikalne albumy
            sequelize.query(`
                SELECT COUNT(DISTINCT albums.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                WHERE plays."profileId" = :profileId
            `, { transaction: this.transaction,
                replacements: { profileId: this.profileId },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as { count: string }).count)),
            // Podcast plays count
            PodcastPlay.count({ transaction: this.transaction, where: { profileId: this.profileId } }),
            // Unique shows (via join)
            sequelize.query(`
                SELECT COUNT(DISTINCT shows.id) as count 
                FROM podcast_plays 
                JOIN episodes ON podcast_plays."episodeId" = episodes.id
                JOIN shows ON episodes."showId" = shows.id  
                WHERE podcast_plays."profileId" = :profileId
            `, { transaction: this.transaction,
                replacements: { profileId: this.profileId },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as { count: string }).count)),
            // Unique episodes
            PodcastPlay.count({ transaction: this.transaction,
                where: { profileId: this.profileId },
                distinct: true,
                col: 'episodeId'
            })
        ])

        await Profile.update({
            statistics: {
                totalPlays,
                totalMinutes: Math.round((totalMsPlayed || 0) / 60000),
                uniqueTracks,
                uniqueArtists,
                uniqueAlbums,
                totalPodcastPlays,
                totalAudiobookPlays: await AudiobookPlay.count({ where: { profileId: this.profileId }, transaction: this.transaction }),
                uniqueShows,
                uniqueEpisodes,
                uniqueAudiobooks: await AudiobookPlay.count({ where: { profileId: this.profileId }, distinct: true, col: 'audiobookId', transaction: this.transaction })
            },
            lastImport: new Date(),
            updatedAt: new Date()
        }, { transaction: this.transaction,
            where: { id: this.profileId }
        })

        console.log('✅ Profile statistics updated')
        console.log(`   🎵 Music: ${totalPlays} plays, ${uniqueTracks} tracks, ${uniqueArtists} artists`)
        console.log(`   🎙️ Podcasts: ${totalPodcastPlays} plays, ${uniqueShows} shows, ${uniqueEpisodes} episodes`)
    }

    /**
     * Aktualizuj statystyki w czasie rzeczywistym
     */
    private async updateRealTimeStats(): Promise<void> {
        if (!this.profileName) return
        this.progressManager.updateStats(this.profileName, this.stats)
    }

    private printStats(): void {
        console.log('\n📈 Import Statistics:')
        console.log('-------------------')
        console.log(`Files Processed: ${this.stats.filesProcessed}`)
        console.log(`Total Records: ${this.stats.totalRecords}`)
        console.log(`Skipped Records: ${this.stats.skippedRecords}`)
        console.log('\n🎵 Music:')
        console.log(`  Plays Created: ${this.stats.playsCreated}`)
        console.log(`  Artists Created: ${this.stats.artistsCreated}`)
        console.log(`  Albums Created: ${this.stats.albumsCreated}`)
        console.log(`  Tracks Created: ${this.stats.tracksCreated}`)
        console.log('\n🎙️ Podcasts:')
        console.log(`  Plays Created: ${this.stats.podcastPlaysCreated}`)
        console.log(`  Shows Created: ${this.stats.showsCreated}`)
        console.log(`  Episodes Created: ${this.stats.episodesCreated}`)
        console.log('\n📚 Audiobooks:')
        console.log(`  Plays Created: ${this.stats.audiobookPlaysCreated}`)
        console.log(`  Audiobooks Created: ${this.stats.audiobooksCreated}`)
        console.log('\n⚠️ Skipped Reasons:')
        Object.entries(this.stats.skippedReasons).forEach(([reason, count]) => {
            if (count > 0) console.log(`  ${reason}: ${count}`)
        })
    }
}

// Jeśli skrypt jest uruchamiany bezpośrednio
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const args = process.argv.slice(2)
    const profileName = args[0]
    
    // Prosta obsługa argumentów wiersza poleceń
    const importer = new SpotifyDataImporter(undefined, profileName)
    
    importer.import()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error)
            process.exit(1)
        })
}

export default SpotifyDataImporter
