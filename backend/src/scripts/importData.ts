import fs from 'fs'
import path from 'path'
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
        this.musicImporter = new MusicImporter(this.stats, this.profileId);
        this.podcastImporter = new PodcastImporter(this.stats, this.profileId);
        this.audiobookImporter = new AudiobookImporter(this.stats, this.profileId);
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

            // Utwórz lub pobierz profil
            if (this.profileName) {
                await this.getOrCreateProfile()
            }

            // Initialize importers after profile is ready
            this.initializeImporters();

            // Clear existing data for this profile (optional - remove in production)
            await this.clearExistingData()

            // Find all JSON files
            const files = this.findJsonFiles()
            console.log(`📄 Found ${files.length} JSON files`)

            if (files.length === 0) {
                console.log('❌ No JSON files found in data directory')
                console.log('💡 Please place your Spotify JSON files in the ./data/ folder')
                if (this.profileName) {
                    this.progressManager.errorImport(this.profileName, 'No JSON files found')
                }
                throw new Error('No JSON files found in data directory')
            }

            // Szacuj całkowitą liczbę rekordów (szybkie przejrzenie plików)
            const estimatedTotal = this.estimateTotalRecords(files)

            // Rozpocznij śledzenie progress
            if (this.profileName) {
                this.progressManager.startImport(this.profileName, files.length, estimatedTotal)
            }

            // Process each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                await this.processFileWithProgress(file, i)

                // Oznacz plik jako ukończony
                if (this.profileName) {
                    this.progressManager.completeFile(this.profileName)
                }

                // Krótka przerwa między plikami żeby nie blokować event loop
                await this.sleep(100)
            }

            // Update profile statistics
            if (this.profileId) {
                await this.updateProfileStatistics()
            }

            // Agreguj statystyki dla szybszego ładowania wykresów
            if (this.profileId) {
                console.log('\n📊 Aggregating statistics for fast chart loading...')
                const aggregator = new StatsAggregator(this.profileId)
                await aggregator.aggregateAllStats()
                console.log('✅ Statistics aggregation completed!')
            }

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
                this.progressManager.errorImport(this.profileName, error instanceof Error ? error.message : 'Unknown error')
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

        let profile = await Profile.findOne({ where: { name: this.profileName } })

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
            })
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
            Play.destroy({ where: { profileId: this.profileId } }),
            PodcastPlay.destroy({ where: { profileId: this.profileId } }),
            AudiobookPlay.destroy({ where: { profileId: this.profileId } })
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
            .sort()
    }

    /**
     * Szacuj całkowitą liczbę rekordów
     */
    private estimateTotalRecords(files: string[]): number {
        let total = 0
        for (const file of files) {
            const filePath = path.join(this.dataDir, file)
            const content = fs.readFileSync(filePath, 'utf8')
            const data = JSON.parse(content)
            total += data.length
        }
        return total
    }

    /**
     * Przetwórz plik z progress tracking
     */
    private async processFileWithProgress(file: string, index: number): Promise<void> {
        const filePath = path.join(this.dataDir, file)
        console.log(`\n📄 Processing file ${index + 1}: ${file}`)

        const content = fs.readFileSync(filePath, 'utf8')
        const data: SpotifyPlayData[] = JSON.parse(content)

        console.log(`   📊 Records in file: ${data.length}`)

        // Batch processing dla lepszej wydajności
        const batchSize = 1000
        let processed = 0
        let lastStatsUpdate = Date.now()

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize)
            await this.processBatch(batch)
            processed += batch.length

            if (this.profileName) {
                this.progressManager.updateFileProgress(this.profileName, file, index, processed, data.length)
                // Aktualizuj statystyki co 5 sekund podczas importu
                const now = Date.now()
                if (now - lastStatsUpdate > 5000) {
                    await this.updateRealTimeStats()
                    lastStatsUpdate = now
                }
            }

            // Progress log
            if (processed % 5000 === 0 || processed === data.length) {
                console.log(`   ⏳ Processed: ${processed}/${data.length} records`)
            }

            // Krótka przerwa żeby nie blokować event loop
            if (i % 10000 === 0) {
                await this.sleep(10)
            }
        }

        this.stats.filesProcessed++
        this.stats.totalRecords += data.length
        console.log(`   ✅ File completed: ${data.length} records processed`)
        
        // Aktualizuj statystyki na końcu pliku
        if (this.profileName) {
            await this.updateRealTimeStats()
        }
    }

    /**
     * Przetwórz batch rekordów
     */
    private async processBatch(batch: SpotifyPlayData[]): Promise<void> {
        for (const record of batch) {
            try {
                await this.processRecord(record)
            } catch (error) {
                console.error('Error processing record:', error)
                this.stats.skippedRecords++
                this.incrementSkip('errors')
            }
        }
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
            Play.count({ where: { profileId: this.profileId } }),
            Play.sum('msPlayed', { where: { profileId: this.profileId } }),
            Play.count({
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
            `, {
                replacements: { profileId: this.profileId },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            // Policz unikalne albumy
            sequelize.query(`
                SELECT COUNT(DISTINCT albums.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                WHERE plays."profileId" = :profileId
            `, {
                replacements: { profileId: this.profileId },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            // Podcast plays count
            PodcastPlay.count({ where: { profileId: this.profileId } }),
            // Unique shows (via join)
            sequelize.query(`
                SELECT COUNT(DISTINCT shows.id) as count 
                FROM podcast_plays 
                JOIN episodes ON podcast_plays."episodeId" = episodes.id
                JOIN shows ON episodes."showId" = shows.id  
                WHERE podcast_plays."profileId" = :profileId
            `, {
                replacements: { profileId: this.profileId },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            // Unique episodes
            PodcastPlay.count({
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
                totalAudiobookPlays: 0,
                uniqueShows,
                uniqueEpisodes,
                uniqueAudiobooks: 0
            },
            updatedAt: new Date()
        }, {
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

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
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
if (import.meta.url === `file://${process.argv[1]}`) {
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
