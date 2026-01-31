import { useState, useEffect } from 'react'

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

export const useDashboardStats = (selectedProfile: string | null) => {
    const [stats, setStats] = useState<DashboardStats>({
        totalPlays: 0,
        totalMinutes: 0,
        uniqueTracks: 0,
        uniqueArtists: 0,
        uniqueAlbums: 0,
        topCountry: '——',
        avgSessionLength: 0,
        avgSessionDuration: 0
    })
    const [podcastStats, setPodcastStats] = useState<PodcastStats>({
        totalPodcastPlays: 0,
        totalPodcastMinutes: 0,
        uniqueShows: 0,
        uniqueEpisodes: 0
    })
    const [topTracks, setTopTracks] = useState<ChartItem[]>([])
    const [topArtists, setTopArtists] = useState<ChartItem[]>([])
    const [topShows, setTopShows] = useState<ChartItem[]>([])
    const [topEpisodes, setTopEpisodes] = useState<ChartItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const profileParam = selectedProfile ? `?profileId=${selectedProfile}` : ''

            // Fetch overview stats
            const statsRes = await fetch(`/api/stats/overview${profileParam}`)
            if (statsRes.ok) {
                const statsData = await statsRes.json()
                const apiStats = statsData.data || {}
                setStats({
                    totalPlays: apiStats.totalPlays || 0,
                    totalMinutes: apiStats.totalMinutes || 0,
                    uniqueTracks: apiStats.uniqueTracks || 0,
                    uniqueArtists: apiStats.uniqueArtists || 0,
                    uniqueAlbums: apiStats.uniqueAlbums || 0,
                    topCountry: apiStats.topCountry || '——',
                    avgSessionLength: apiStats.avgSessionDuration || 0,
                    avgSessionDuration: apiStats.avgSessionDuration || 0
                })
            }

            // Fetch top tracks
            const tracksRes = await fetch(`/api/tracks?limit=5&sortBy=totalPlays&sortOrder=desc${selectedProfile ? `&profileId=${selectedProfile}` : ''}`)
            if (tracksRes.ok) {
                const tracksData = await tracksRes.json()
                setTopTracks(tracksData.data?.map((track: any) => ({
                    name: track.name,
                    artist: track.artist?.name || 'Unknown Artist',
                    plays: parseInt(track.totalPlays) || 0
                })) || [])
            }

            // Fetch top artists
            const artistsRes = await fetch(`/api/artists/top?limit=5${selectedProfile ? `&profileId=${selectedProfile}` : ''}`)
            if (artistsRes.ok) {
                const artistsData = await artistsRes.json()
                setTopArtists(artistsData.data?.map((artist: any) => ({
                    name: artist.name,
                    plays: artist.plays
                })) || [])
            }

            // Fetch podcast stats
            if (selectedProfile) {
                const podcastStatsRes = await fetch(`/api/podcasts/stats?profileId=${selectedProfile}`)
                if (podcastStatsRes.ok) {
                    const podcastStatsData = await podcastStatsRes.json()
                    if (podcastStatsData.success) {
                        setPodcastStats(podcastStatsData.data || {
                            totalPodcastPlays: 0,
                            totalPodcastMinutes: 0,
                            uniqueShows: 0,
                            uniqueEpisodes: 0
                        })
                    }
                }

                // Fetch top shows
                const showsRes = await fetch(`/api/podcasts/top-shows?limit=5&profileId=${selectedProfile}`)
                if (showsRes.ok) {
                    const showsData = await showsRes.json()
                    if (showsData.success) {
                        setTopShows(showsData.data?.map((show: any) => ({
                            name: show.name,
                            plays: show.playCount
                        })) || [])
                    }
                }

                // Fetch top episodes
                const episodesRes = await fetch(`/api/podcasts/top-episodes?limit=5&profileId=${selectedProfile}`)
                if (episodesRes.ok) {
                    const episodesData = await episodesRes.json()
                    if (episodesData.success) {
                        setTopEpisodes(episodesData.data?.map((episode: any) => ({
                            name: episode.name,
                            plays: episode.playCount
                        })) || [])
                    }
                }
            } else {
                 // Reset podcast stats if not selected (or implement aggregate if supported)
                 setPodcastStats({
                    totalPodcastPlays: 0,
                    totalPodcastMinutes: 0,
                    uniqueShows: 0,
                    uniqueEpisodes: 0
                })
                setTopShows([])
                setTopEpisodes([])
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [selectedProfile])

    return {
        stats,
        podcastStats,
        topTracks,
        topArtists,
        topShows,
        topEpisodes,
        loading,
        fetchDashboardData
    }
}
