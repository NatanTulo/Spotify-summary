import { Show } from '../../models/podcasts/Show.js'
import { Episode } from '../../models/podcasts/Episode.js'
import { PodcastPlay } from '../../models/podcasts/PodcastPlay.js'
import { SpotifyPlayData, ImportStats } from './types.js'

export class PodcastImporter {
    private shows = new Map<string, number>()    // name -> id
    private episodes = new Map<string, number>() // name:showId -> id
    private stats: ImportStats
    private profileId: number

    constructor(stats: ImportStats, profileId: number) {
        this.stats = stats
        this.profileId = profileId
    }

    public async processRecord(record: SpotifyPlayData): Promise<void> {
        // Osobny (wyższy) próg dla podcastów: domyślnie 3 minuty (180000 ms)
        const podcastMinMs = Number(process.env.PODCAST_MIN_MS_PLAYED || '180000')
        if (record.ms_played < podcastMinMs) {
            this.stats.skippedRecords++
            this.incrementSkip('underThreshold')
            return
        }

        if (!record.ts) {
            this.stats.skippedRecords++
            this.incrementSkip('missingFieldsPodcast')
            return
        }

        const showName = record.episode_show_name || 'Unknown Show'
        const episodeName = record.episode_name || record.spotify_episode_uri || 'Unknown Episode'

        const showId = await this.getOrCreateShow(showName)
        const episodeId = await this.getOrCreateEpisode(
            episodeName,
            showId,
            record.spotify_episode_uri || undefined
        )

        await this.createPodcastPlay(record, episodeId)
    }

    private incrementSkip(reason: string) {
        this.stats.skippedReasons[reason] = (this.stats.skippedReasons[reason] || 0) + 1
    }

    /**
     * Utwórz lub pobierz show/podcast
     */
    private async getOrCreateShow(name: string): Promise<number> {
        if (this.shows.has(name)) {
            return this.shows.get(name)!
        }

        let show = await Show.findOne({ where: { name } })

        if (!show) {
            show = await Show.create({
                name,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.showsCreated++
        }

        this.shows.set(name, show.id)
        return show.id
    }

    /**
     * Utwórz lub pobierz episode
     */
    private async getOrCreateEpisode(name: string, showId: number, spotifyUri?: string): Promise<number> {
        const cacheKey = `${name}:${showId}`
        
        if (this.episodes.has(cacheKey)) {
            return this.episodes.get(cacheKey)!
        }

        let episode: Episode | null = null

        // Preferuj dopasowanie po spotifyUri jeśli dostępne
        if (spotifyUri) {
            episode = await Episode.findOne({ where: { spotifyUri } })
        }

        if (!episode) {
            episode = await Episode.findOne({ where: { name, showId } })
        }

        if (!episode) {
            episode = await Episode.create({
                name,
                showId,
                spotifyUri: spotifyUri || null,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.episodesCreated++
        }

        this.episodes.set(cacheKey, episode.id)
        return episode.id
    }

    /**
     * Utwórz podcast play
     */
    private async createPodcastPlay(record: SpotifyPlayData, episodeId: number): Promise<void> {
        await PodcastPlay.create({
            episodeId,
            profileId: this.profileId,
            timestamp: new Date(record.ts),
            msPlayed: record.ms_played,
            username: record.username || null,
            platform: record.platform || null,
            country: record.conn_country || null,
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

        this.stats.podcastPlaysCreated++
    }
}
