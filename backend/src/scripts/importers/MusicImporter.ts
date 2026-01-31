import { Artist } from '../../models/music/Artist.js'
import { Album } from '../../models/music/Album.js'
import { Track } from '../../models/music/Track.js'
import { Play } from '../../models/music/Play.js'
import { SpotifyPlayData, ImportStats } from './types.js'

export class MusicImporter {
    private artists = new Map<string, number>() // name -> id
    private albums = new Map<string, number>()   // name:artistId -> id
    private tracks = new Map<string, number>()   // name:albumId -> id
    private stats: ImportStats
    private profileId: number

    constructor(stats: ImportStats, profileId: number) {
        this.stats = stats
        this.profileId = profileId
    }

    public async processRecord(record: SpotifyPlayData): Promise<void> {
        // Konfigurowalny próg czasu odtwarzania
        const minMs = Number(process.env.MIN_MS_PLAYED || '5000')
        if (record.ms_played < minMs) {
            this.stats.skippedRecords++
            this.incrementSkip('underThreshold')
            return
        }

        if (!record.ts) {
            this.stats.skippedRecords++
            this.incrementSkip('missingFieldsMusic')
            return
        }

        // Fallbacky dla brakujących metadanych (częste w Extended History)
        const artistName = record.master_metadata_album_artist_name || 'Unknown Artist'
        const albumName = record.master_metadata_album_album_name || 'Unknown Album'
        // Jeśli brak nazwy utworu, użyj URI jako nazwy (stabilny unikalny klucz),
        // a gdy brak URI, zapisz jako Unknown Track (rzadkie przypadki)
        const trackName = record.master_metadata_track_name || record.spotify_track_uri || 'Unknown Track'

        const artistId = await this.getOrCreateArtist(artistName)
        const albumId = await this.getOrCreateAlbum(albumName, artistId)
        const trackId = await this.getOrCreateTrack(
            trackName,
            albumId,
            record.spotify_track_uri || undefined
        )

        await this.createPlay(record, trackId)
    }

    private incrementSkip(reason: string) {
        this.stats.skippedReasons[reason] = (this.stats.skippedReasons[reason] || 0) + 1
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

        let track: Track | null = null

        // Najpierw szukaj po URI (jeśli dostępne)
        if (spotifyUri) {
            track = await Track.findOne({ where: { uri: spotifyUri } })
        }

        // Jeśli nie znaleziono po URI, szukaj po (name, albumId)
        if (!track) {
            track = await Track.findOne({ where: { name, albumId } })
        }

        if (!track) {
            track = await Track.create({
                name,
                albumId,
                uri: spotifyUri,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            this.stats.tracksCreated++
        } else if (spotifyUri && !track.uri) {
            // Uzupełnij brakujące URI
            track.uri = spotifyUri
            await track.save()
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
            profileId: this.profileId,
            timestamp: new Date(record.ts),
            msPlayed: record.ms_played,
            username: record.username || null,
            platform: record.platform || null,
            country: record.conn_country || null,
            ipAddress: record.ip_addr || null,
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

        this.stats.playsCreated++
    }
}
