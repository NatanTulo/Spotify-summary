import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { connectDB } from '../config/database.js'
import { Artist } from '../models/Artist.js'
import { Album } from '../models/Album.js'
import { Track } from '../models/Track.js'
import { Play } from '../models/Play.js'
import { Profile } from '../models/Profile.js'
import ImportProgressManager from '../utils/ImportProgressManager.js'
import { StatsAggregator } from '../utils/StatsAggregator.js'
import mongoose from 'mongoose'

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
    private profileId?: string
    private stats = {
        filesProcessed: 0,
        totalRecords: 0,
        artistsCreated: 0,
        albumsCreated: 0,
        tracksCreated: 0,
        playsCreated: 0,
        skippedRecords: 0
    }

    constructor(dataDir: string = '../data', profileName?: string) {
        this.dataDir = path.resolve(dataDir)
        this.profileName = profileName

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
        const progressManager = ImportProgressManager.getInstance()

        try {
            console.log('🚀 Starting Spotify data import...')
            console.log(`📁 Data directory: ${this.dataDir}`)
            if (this.profileName) {
                console.log(`👤 Profile: ${this.profileName}`)
            }

            await connectDB()
            console.log('✅ Connected to MongoDB')

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
                    progressManager.errorImport(this.profileName, 'No JSON files found')
                }
                throw new Error('No JSON files found in data directory')
            }

            // Szacuj całkowitą liczbę rekordów (szybkie przejrzenie plików)
            const estimatedTotal = this.estimateTotalRecords(files)

            // Rozpocznij śledzenie progress
            if (this.profileName) {
                progressManager.startImport(this.profileName, files.length, estimatedTotal)
            }

            // Process each file
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                await this.processFileWithProgress(file, i)

                // Oznacz plik jako ukończony
                if (this.profileName) {
                    progressManager.completeFile(this.profileName)
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
                const aggregator = new StatsAggregator(new mongoose.Types.ObjectId(this.profileId))
                await aggregator.aggregateAllStats()
                console.log('✅ Statistics aggregation completed!')
            }

            // Zakończ śledzenie progress
            if (this.profileName) {
                progressManager.updateStats(this.profileName, this.stats)
                progressManager.completeImport(this.profileName)
            }

            console.log('\n✅ Import completed successfully!')
            this.printStats()

        } catch (error) {
            console.error('❌ Import failed:', error)
            if (this.profileName) {
                progressManager.errorImport(this.profileName, error instanceof Error ? error.message : 'Unknown error')
            }
            throw error
        }
    }

    private async clearExistingData(): Promise<void> {
        console.log('🧹 Clearing existing data...')

        if (this.profileId) {
            // Usuń tylko dane tego profilu
            await Play.deleteMany({ profileId: this.profileId })
            console.log(`✅ Existing data cleared for profile: ${this.profileName}`)
        } else {
            // Usuń wszystkie dane
            await Promise.all([
                Play.deleteMany({}),
                Track.deleteMany({}),
                Album.deleteMany({}),
                Artist.deleteMany({}),
                Profile.deleteMany({})
            ])
            console.log('✅ All existing data cleared')
        }
    }

    private async getOrCreateProfile(): Promise<void> {
        if (!this.profileName) return

        let profile = await Profile.findOne({ name: this.profileName })

        if (!profile) {
            profile = new Profile({
                name: this.profileName,
                statistics: {
                    totalPlays: 0,
                    totalMinutes: 0,
                    uniqueTracks: 0,
                    uniqueArtists: 0,
                    uniqueAlbums: 0
                }
            })
            await profile.save()
            console.log(`✅ Created new profile: ${this.profileName}`)
        } else {
            console.log(`✅ Using existing profile: ${this.profileName}`)
        }

        this.profileId = profile._id.toString()
    }

    private async updateProfileStatistics(): Promise<void> {
        if (!this.profileId) return

        const [totalPlays, totalMinutes, uniqueTracks] = await Promise.all([
            Play.countDocuments({ profileId: this.profileId }),
            Play.aggregate([
                { $match: { profileId: this.profileId } },
                { $group: { _id: null, total: { $sum: '$msPlayed' } } }
            ]),
            Play.distinct('trackId', { profileId: this.profileId }).then(ids => ids.length)
        ])

        await Profile.findByIdAndUpdate(this.profileId, {
            'statistics.totalPlays': totalPlays,
            'statistics.totalMinutes': Math.round((totalMinutes[0]?.total || 0) / 60000),
            'statistics.uniqueTracks': uniqueTracks,
            lastImport: new Date()
        })

        console.log(`✅ Updated profile statistics for: ${this.profileName}`)
    }

    private findJsonFiles(): string[] {
        if (!fs.existsSync(this.dataDir)) {
            return []
        }

        return fs.readdirSync(this.dataDir)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(this.dataDir, file))
    }

    private async processRecord(record: SpotifyPlayData): Promise<void> {
        // Skip podcast episodes
        if (record.episode_name || record.episode_show_name) {
            return
        }

        // Skip records without required data
        if (!record.master_metadata_track_name ||
            !record.master_metadata_album_artist_name ||
            !record.master_metadata_album_album_name ||
            !record.ts ||
            typeof record.ms_played !== 'number') {
            return
        }

        // Get or create artist
        const artist = await this.getOrCreateArtist(record.master_metadata_album_artist_name)

        // Get or create album
        const album = await this.getOrCreateAlbum(
            record.master_metadata_album_album_name,
            artist._id
        )

        // Get or create track
        const track = await this.getOrCreateTrack(
            record.master_metadata_track_name,
            album._id,
            record.spotify_track_uri
        )

        // Create play record
        await this.createPlay(record, track._id)
    }

    private async getOrCreateArtist(name: string) {
        let artist = await Artist.findOne({ name })

        if (!artist) {
            artist = new Artist({ name })
            await artist.save()
            this.stats.artistsCreated++
        }

        return artist
    }

    private async getOrCreateAlbum(name: string, artistId: string) {
        let album = await Album.findOne({ name, artistId })

        if (!album) {
            album = new Album({ name, artistId })
            await album.save()
            this.stats.albumsCreated++
        }

        return album
    }

    private async getOrCreateTrack(name: string, albumId: string, uri?: string) {
        let track = await Track.findOne({ name, albumId })

        if (!track) {
            track = new Track({
                name,
                albumId,
                uri: uri || undefined
            })
            await track.save()
            this.stats.tracksCreated++
        }

        return track
    }

    private async createPlay(record: SpotifyPlayData, trackId: string): Promise<void> {
        const play = new Play({
            trackId,
            profileId: this.profileId || undefined,
            timestamp: new Date(record.ts),
            msPlayed: record.ms_played,
            username: record.username || undefined,
            platform: record.platform || undefined,
            country: record.conn_country || undefined,
            ipAddress: record.ip_addr || record.ip_addr_decrypted || undefined,
            userAgent: record.user_agent_decrypted || undefined,
            reasonStart: record.reason_start || undefined,
            reasonEnd: record.reason_end || undefined,
            shuffle: record.shuffle,
            skipped: record.skipped,
            offline: record.offline,
            offlineTimestamp: record.offline_timestamp && record.offline_timestamp !== null ? new Date(record.offline_timestamp) : undefined,
            incognitoMode: record.incognito_mode
        })

        await play.save()
        this.stats.playsCreated++
    }

    private printStats(): void {
        console.log('\n📊 Import Statistics:')
        console.log(`   📄 Files processed: ${this.stats.filesProcessed}`)
        console.log(`   📝 Total records: ${this.stats.totalRecords}`)
        console.log(`   🎤 Artists created: ${this.stats.artistsCreated}`)
        console.log(`   💿 Albums created: ${this.stats.albumsCreated}`)
        console.log(`   🎵 Tracks created: ${this.stats.tracksCreated}`)
        console.log(`   ▶️ Plays created: ${this.stats.playsCreated}`)
        console.log(`   ⚠️ Skipped records: ${this.stats.skippedRecords}`)
    }

    // Nowe metody dla progress tracking
    private estimateTotalRecords(files: string[]): number {
        // Szybka estymacja - załóżmy średnio 15000 rekordów na plik
        return files.length * 15000
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    private async processFileWithProgress(filePath: string, fileIndex: number): Promise<void> {
        const progressManager = ImportProgressManager.getInstance()
        const fileName = path.basename(filePath)

        console.log(`\n📄 Processing: ${fileName}`)

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
            const totalRecords = data.length

            console.log(`   📊 Records in file: ${totalRecords}`)

            if (this.profileName) {
                progressManager.updateFileProgress(this.profileName, fileName, fileIndex, 0, totalRecords)
            }

            let batchSize = 1000 // Przetwarzaj w batch'ach

            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, Math.min(i + batchSize, data.length))

                // Przetwórz batch
                for (const record of batch) {
                    await this.processRecord(record)
                }

                // Update progress co batch
                if (this.profileName) {
                    progressManager.updateFileProgress(this.profileName, fileName, fileIndex, i + batch.length, totalRecords)
                    progressManager.updateStats(this.profileName, this.stats)
                }

                // Krótka przerwa co batch żeby nie blokować event loop
                if (i + batchSize < data.length) {
                    await this.sleep(10)
                }

                // Log progress co 1000 rekordów
                if ((i + batch.length) % 1000 === 0 || i + batch.length === data.length) {
                    console.log(`   ⏳ Processed ${i + batch.length}/${totalRecords} records...`)
                }
            }

            this.stats.filesProcessed++
            console.log(`   ✅ Completed: ${data.length} records processed, ${this.stats.skippedRecords} skipped`)

        } catch (error) {
            console.error(`   ❌ Error processing ${fileName}:`, error)
            throw error
        }
    }
}

// Run import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const profileName = process.argv[2] // Nazwa profilu jako argument
    const importer = new SpotifyDataImporter('../data', profileName)
    importer.import()
}

export default SpotifyDataImporter
