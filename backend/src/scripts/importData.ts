import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { connectDB, sequelize } from '../config/database.js'
import { QueryTypes } from 'sequelize'
import { Artist } from '../models/Artist.js'
import { Album } from '../models/Album.js'
import { Track } from '../models/Track.js'
import { Play } from '../models/Play.js'
import { Profile } from '../models/Profile.js'
import ImportProgressManager from '../utils/ImportProgressManager.js'
import { StatsAggregator } from '../utils/StatsAggregator.js'

dotenv.config()

interface SpotifyPlayData {
    ts: string
    username?: string
    platform?: string
    ms_played: number
    conn_country?: string
    ip_addr?: string
    ip_addr_decrypted?: string
    user_agent_decrypted?: string
    master_metadata_track_name?: string
    master_metadata_album_artist_name?: string
    master_metadata_album_album_name?: string
    spotify_track_uri?: string
    episode_name?: string | null
    episode_show_name?: string | null
    spotify_episode_uri?: string | null
    reason_start?: string
    reason_end?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    offline_timestamp?: string | null
    incognito_mode?: boolean
}

class SpotifyDataImporter {
    private dataDir: string
    private profileName?: string
    private profileId?: number
    private stats = {
        filesProcessed: 0,
        totalRecords: 0,
        artistsCreated: 0,
        albumsCreated: 0,
        tracksCreated: 0,
        playsCreated: 0,
        skippedRecords: 0
    }

    private artists = new Map<string, number>() // name -> id
    private albums = new Map<string, number>()   // name:artistId -> id
    private tracks = new Map<string, number>()   // name:albumId -> id
    private progressManager: ImportProgressManager

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
                totalPlays: 0,
                totalMinutes: 0,
                uniqueTracks: 0,
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
        await Play.destroy({ where: { profileId: this.profileId } })
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
            .filter(file => file.endsWith('.json') && file.includes('Streaming_History'))
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

        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize)
            await this.processBatch(batch)
            processed += batch.length

            if (this.profileName) {
                this.progressManager.updateFileProgress(this.profileName, file, index, processed, data.length)
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
            }
        }
    }

    /**
     * Przetwórz pojedynczy rekord
     */
    private async processRecord(record: SpotifyPlayData): Promise<void> {
        // Skip jeśli brak podstawowych danych
        if (!record.master_metadata_track_name ||
            !record.master_metadata_album_artist_name ||
            !record.master_metadata_album_album_name ||
            !record.ts) {
            this.stats.skippedRecords++
            return
        }

        // Pomiń odtwarzania krótsze niż 30 sekund (30000ms)
        if (record.ms_played < 30000) {
            this.stats.skippedRecords++
            return
        }

        const artistId = await this.getOrCreateArtist(record.master_metadata_album_artist_name)
        const albumId = await this.getOrCreateAlbum(
            record.master_metadata_album_album_name,
            artistId
        )
        const trackId = await this.getOrCreateTrack(
            record.master_metadata_track_name,
            albumId,
            record.spotify_track_uri
        )

        await this.createPlay(record, trackId)
    }

    /**
     * Utwórz lub pobierz artystę
     */
    private async getOrCreateArtist(name: string): Promise<number> {
        if (this.artists.has(name)) {
            return this.artists.get(name)!
        }

        let artist = await Artist.findOne({ where: { name } })

        if (!artist) {
            artist = await Artist.create({
                name,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.artistsCreated++
        }

        this.artists.set(name, artist.id)
        return artist.id
    }

    /**
     * Utwórz lub pobierz album
     */
    private async getOrCreateAlbum(name: string, artistId: number): Promise<number> {
        const key = `${name}:${artistId}`
        if (this.albums.has(key)) {
            return this.albums.get(key)!
        }

        let album = await Album.findOne({ where: { name, artistId } })

        if (!album) {
            album = await Album.create({
                name,
                artistId,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.albumsCreated++
        }

        this.albums.set(key, album.id)
        return album.id
    }

    /**
     * Utwórz lub pobierz track
     */
    private async getOrCreateTrack(name: string, albumId: number, spotifyUri?: string): Promise<number> {
        const key = `${name}:${albumId}`
        if (this.tracks.has(key)) {
            return this.tracks.get(key)!
        }

        let track = await Track.findOne({ where: { name, albumId } })

        if (!track) {
            track = await Track.create({
                name,
                albumId,
                spotifyId: spotifyUri,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.tracksCreated++
        }

        this.tracks.set(key, track.id)
        return track.id
    }

    /**
     * Utwórz play
     */
    private async createPlay(record: SpotifyPlayData, trackId: number): Promise<void> {
        await Play.create({
            trackId,
            profileId: this.profileId!,
            timestamp: new Date(record.ts),
            msPlayed: record.ms_played,
            country: record.conn_country || null,
            platform: record.platform || null,
            reasonStart: record.reason_start || null,
            reasonEnd: record.reason_end || null,
            shuffle: record.shuffle || false,
            skipped: record.skipped || false,
            offline: record.offline || false,
            incognito: record.incognito_mode || false,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        this.stats.playsCreated++
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
            uniqueAlbums
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
            }).then(result => parseInt((result[0] as any).count))
        ])

        // Aktualizuj pole statistics w profilu
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
            where: { id: this.profileId }
        })

        console.log('✅ Profile statistics updated')
    }

    /**
     * Sleep function
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Wydrukuj statystyki
     */
    private printStats(): void {
        console.log('\n📊 Import Statistics:')
        console.log(`   📄 Files processed: ${this.stats.filesProcessed}`)
        console.log(`   📝 Total records: ${this.stats.totalRecords}`)
        console.log(`   🎵 Artists created: ${this.stats.artistsCreated}`)
        console.log(`   💿 Albums created: ${this.stats.albumsCreated}`)
        console.log(`   🎶 Tracks created: ${this.stats.tracksCreated}`)
        console.log(`   ▶️ Plays created: ${this.stats.playsCreated}`)
        console.log(`   ⏭️ Records skipped: ${this.stats.skippedRecords}`)
    }

    /**
     * Clear all data - użyj ostrożnie!
     */
    async clearAllData(): Promise<void> {
        console.log('🗑️ Clearing all data...')
        await Promise.all([
            Play.destroy({ where: {} }),
            Track.destroy({ where: {} }),
            Album.destroy({ where: {} }),
            Artist.destroy({ where: {} }),
            Profile.destroy({ where: {} })
        ])
        console.log('✅ All data cleared')
    }
}

export default SpotifyDataImporter
