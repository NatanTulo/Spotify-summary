import { Audiobook } from '../../models/audiobooks/Audiobook.js'
import { AudiobookPlay } from '../../models/audiobooks/AudiobookPlay.js'
import { SpotifyPlayData, ImportStats } from './types.js'

export class AudiobookImporter {
    private audiobooks = new Map<string, number>() // name -> id
    private stats: ImportStats
    private profileId: number

    constructor(stats: ImportStats, profileId: number) {
        this.stats = stats
        this.profileId = profileId
    }

    public async processRecord(record: SpotifyPlayData): Promise<void> {
        const minMs = Number(process.env.MIN_MS_PLAYED || '5000')
        if (record.ms_played < minMs) {
            this.stats.skippedRecords++
            this.incrementSkip('underThreshold')
            return
        }

        if (!record.ts) {
            this.stats.skippedRecords++
            this.incrementSkip('missingFieldsAudiobook')
            return
        }

        const title = record.audiobook_title || record.audiobook_uri || 'Unknown Audiobook'

        const audiobookId = await this.getOrCreateAudiobook(
            title,
            record.audiobook_uri || undefined
        )

        await this.createAudiobookPlay(record, audiobookId)
    }

    private incrementSkip(reason: string) {
        this.stats.skippedReasons[reason] = (this.stats.skippedReasons[reason] || 0) + 1
    }

    /**
     * Utwórz lub pobierz audiobook
     */
    private async getOrCreateAudiobook(name: string, spotifyUri?: string): Promise<number> {
        if (this.audiobooks.has(name)) {
            return this.audiobooks.get(name)!
        }

        let audiobook: Audiobook | null = null

        if (spotifyUri) {
            audiobook = await Audiobook.findOne({ where: { spotifyUri } })
        }

        if (!audiobook) {
            audiobook = await Audiobook.findOne({ where: { name } })
        }

        if (!audiobook) {
            audiobook = await Audiobook.create({
                name,
                spotifyUri: spotifyUri || null,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.audiobooksCreated++
        }

        this.audiobooks.set(name, audiobook.id)
        return audiobook.id
    }

    /**
     * Utwórz audiobook play
     */
    private async createAudiobookPlay(record: SpotifyPlayData, audiobookId: number): Promise<void> {
        await AudiobookPlay.create({
            audiobookId,
            profileId: this.profileId,
            timestamp: new Date(record.ts),
            msPlayed: record.ms_played,
            username: record.username || null,
            chapterTitle: record.audiobook_chapter_title || null,
            chapterUri: record.audiobook_chapter_uri || null,
            country: record.conn_country || null,
            platform: record.platform || null,
            ipAddr: record.ip_addr || null,
            userAgent: record.user_agent_decrypted || null,
            reasonStart: record.reason_start || null,
            reasonEnd: record.reason_end || null,
            shuffle: record.shuffle || false,
            skipped: record.skipped || false,
            offline: record.offline || false,
            offlineTimestamp: record.offline_timestamp ? new Date(Number(record.offline_timestamp) * 1000) : null,
            incognitoMode: record.incognito_mode || false,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        this.stats.audiobookPlaysCreated++
    }
}
