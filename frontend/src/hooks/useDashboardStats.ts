import { useApiQuery } from '../lib/api'

export interface DashboardStats {
    totalPlays: number
    totalMinutes: number
    uniqueTracks: number
    uniqueArtists: number
    uniqueAlbums: number
    topCountry: string
    avgSessionLength: number
    avgSessionDuration: number
}

export interface PodcastStats {
    totalPodcastPlays: number
    totalPodcastMinutes: number
    uniqueShows: number
    uniqueEpisodes: number
}

export interface ChartItem {
    name: string
    plays: number
    artist?: string
}

interface TrackSummary { name: string; artist?: { name: string }; totalPlays: number }
interface ArtistSummary { name: string; plays: number }
interface PodcastSummary { name: string; playCount: number }
export const useDashboardStats = (selectedProfile: string | null) => {
    const suffix = `profileId=${selectedProfile || 'all'}`
    const overview = useApiQuery<DashboardStats>(`/api/stats/overview?${suffix}`)
    const tracks = useApiQuery<TrackSummary[]>(`/api/tracks?limit=5&sortBy=totalPlays&sortOrder=desc&${suffix}`)
    const artists = useApiQuery<ArtistSummary[]>(`/api/artists/top?limit=5&${suffix}`)
    const podcasts = useApiQuery<PodcastStats>(`/api/podcasts/stats?${suffix}`)
    const shows = useApiQuery<PodcastSummary[]>(`/api/podcasts/top-shows?limit=5&${suffix}`)
    const episodes = useApiQuery<PodcastSummary[]>(`/api/podcasts/top-episodes?limit=5&${suffix}`)
    const queries = [overview, tracks, artists, podcasts, shows, episodes]
    const stats = overview.data?.data || { totalPlays: 0, totalMinutes: 0, uniqueTracks: 0, uniqueArtists: 0, uniqueAlbums: 0, topCountry: '——', avgSessionDuration: 0, avgSessionLength: 0 }
    return {
        stats: { ...stats, avgSessionLength: stats.avgSessionDuration },
        podcastStats: podcasts.data?.data || { totalPodcastPlays: 0, totalPodcastMinutes: 0, uniqueShows: 0, uniqueEpisodes: 0 },
        topTracks: (tracks.data?.data || []).map(item => ({ name: item.name, artist: item.artist?.name, plays: Number(item.totalPlays) })),
        topArtists: artists.data?.data || [],
        topShows: (shows.data?.data || []).map(item => ({ name: item.name, plays: item.playCount })),
        topEpisodes: (episodes.data?.data || []).map(item => ({ name: item.name, plays: item.playCount })),
        loading: queries.some(query => query.isPending),
        error: queries.find(query => query.error)?.error,
        fetchDashboardData: () => Promise.all(queries.map(query => query.refetch())),
    }
}
