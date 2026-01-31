export interface SpotifyPlayData {
    ts: string
    username?: string
    platform?: string
    ms_played: number
    conn_country?: string
    ip_addr?: string
    ip_addr_decrypted?: string
    user_agent_decrypted?: string
    master_metadata_track_name?: string | null
    master_metadata_album_artist_name?: string | null
    master_metadata_album_album_name?: string | null
    spotify_track_uri?: string | null
    episode_name?: string | null
    episode_show_name?: string | null
    spotify_episode_uri?: string | null
    audiobook_title?: string | null
    audiobook_uri?: string | null
    audiobook_chapter_uri?: string | null
    audiobook_chapter_title?: string | null
    reason_start?: string
    reason_end?: string
    shuffle?: boolean
    skipped?: boolean
    offline?: boolean
    offline_timestamp?: string | null | number
    incognito_mode?: boolean
}

export interface ImportStats {
    totalRecords: number
    filesProcessed: number
    artistsCreated: number
    albumsCreated: number
    tracksCreated: number
    playsCreated: number
    showsCreated: number
    episodesCreated: number
    podcastPlaysCreated: number
    audiobooksCreated: number
    audiobookPlaysCreated: number
    skippedRecords: number
    skippedReasons: Record<string, number>
}
