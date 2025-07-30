export interface SpotifyTrack {
    id: string
    name: string
    albumId: string
    uri?: string
    duration?: number
}

export interface SpotifyAlbum {
    id: string
    name: string
    artistId: string
}

export interface SpotifyArtist {
    id: string
    name: string
}

export interface SpotifyPlay {
    id: string
    trackId: string
    timestamp: Date
    msPlayed: number
    platform?: string
    country?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    incognitoMode?: boolean
}

// Podcast interfaces
export interface SpotifyShow {
    id: string
    name: string
    description?: string
}

export interface SpotifyEpisode {
    id: string
    name: string
    showId: string
    spotifyUri?: string
    description?: string
    show?: SpotifyShow
}

export interface SpotifyPodcastPlay {
    id: string
    episodeId: string
    timestamp: Date
    msPlayed: number
    platform?: string
    country?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    incognitoMode?: boolean
    episode?: SpotifyEpisode
}

export interface PodcastStats {
    totalPodcastPlays: number
    totalPodcastMinutes: number
    uniqueShows: number
    uniqueEpisodes: number
}

// Audiobook interfaces
export interface SpotifyAudiobook {
    id: string
    name: string
    author?: string
    spotifyUri?: string
    description?: string
}

export interface SpotifyAudiobookPlay {
    id: string
    audiobookId: string
    timestamp: Date
    msPlayed: number
    platform?: string
    country?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    incognitoMode?: boolean
    audiobook?: SpotifyAudiobook
}

export interface AudiobookStats {
    totalAudiobookPlays: number
    totalAudiobookMinutes: number
    uniqueAudiobooks: number
}

export interface TrackStats {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
}

export interface StatsOverview {
    totalPlays: number
    totalMinutes: number
    uniqueTracks: number
    uniqueArtists: number
    uniqueAlbums: number
    topGenres: string[]
    avgSessionLength: number
}

export interface YearlyStats {
    year: number
    totalPlays: number
    totalMinutes: number
    topTrack: string
    topArtist: string
    topAlbum: string
}

export interface CountryStats {
    country: string
    totalPlays: number
    percentage: number
}

export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
    pagination?: {
        page: number
        limit: number
        total: number
        pages: number
    }
}
