import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Users, Music, Clock, Globe, Radio } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { DataImportGuide } from '@/components/DataImportGuide'
import { useLanguage } from '../context/LanguageContext'

const Dashboard = () => {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    const [stats, setStats] = useState({
        totalPlays: 0,
        totalMinutes: 0,
        uniqueTracks: 0,
        uniqueArtists: 0,
        uniqueAlbums: 0,
        topCountry: '——',
        avgSessionLength: 0,
        avgSessionDuration: 0
    })
    const [podcastStats, setPodcastStats] = useState({
        totalPodcastPlays: 0,
        totalPodcastMinutes: 0,
        uniqueShows: 0,
        uniqueEpisodes: 0
    })
    const [topTracks, setTopTracks] = useState<Array<{ name: string, artist: string, plays: number }>>([])
    const [topArtists, setTopArtists] = useState<Array<{ name: string, plays: number }>>([])
    const [topShows, setTopShows] = useState<Array<{ name: string, plays: number }>>([])
    const [topEpisodes, setTopEpisodes] = useState<Array<{ name: string, plays: number }>>([])

    useEffect(() => {
        fetchDashboardData()
    }, [selectedProfile])

    const fetchDashboardData = async () => {
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
            }

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('dashboard')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('generalStatsDesc')}
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalPlaysCard')}</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalPlays > 0 ? stats.totalPlays.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalPlays > 0 ? t('playsLabel') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('listeningMinutes')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalMinutes > 0 ? stats.totalMinutes.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalMinutes > 0 ? `≈ ${Math.round(stats.totalMinutes / 60)} ${t('approxHours')}` : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('uniqueTracksCard')}</CardTitle>
                        <Music className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.uniqueTracks > 0 ? stats.uniqueTracks.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.uniqueTracks > 0 ? t('differentSongs') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('uniqueArtistsCard')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.uniqueArtists > 0 ? stats.uniqueArtists.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.uniqueArtists > 0 ? t('differentArtists') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('mainCountry')}</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.topCountry}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.topCountry !== '——' ? t('mostListenedIn') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('avgSession')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgSessionLength > 0 ? `${stats.avgSessionLength} min` : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.avgSessionLength > 0 ? t('perSession') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalPodcastPlaysCard')}</CardTitle>
                        <Radio className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {podcastStats.totalPodcastPlays > 0 ? podcastStats.totalPodcastPlays.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {podcastStats.totalPodcastPlays > 0 ? t('playsLabel') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('uniqueShowsCard')}</CardTitle>
                        <Radio className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {podcastStats.uniqueShows > 0 ? podcastStats.uniqueShows.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {podcastStats.uniqueShows > 0 ? t('differentShows') || 'Different shows' : t('noData')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Content - Music */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Artists */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('topArtistsTitle')}</CardTitle>
                        <CardDescription>
                            {t('topArtistsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topArtists.length > 0 ? (
                                topArtists.map((artist, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {artist.name}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {artist.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-4xl mb-2">🎤</div>
                                    <div>{t('noArtistsData')}</div>
                                    <div className="text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Tracks */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('topTracksTitle')}</CardTitle>
                        <CardDescription>
                            {t('topTracksDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topTracks.length > 0 ? (
                                topTracks.map((track, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {track.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {track.artist}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {track.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-4xl mb-2">🎵</div>
                                    <div>{t('noTracksData')}</div>
                                    <div className="text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Content - Podcasts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Shows */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('topShowsTitle')}</CardTitle>
                        <CardDescription>
                            {t('topShowsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topShows.length > 0 ? (
                                topShows.map((show, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {show.name}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {show.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-4xl mb-2">🎙️</div>
                                    <div>{t('noShowsData')}</div>
                                    <div className="text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Episodes */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('topEpisodesTitle')}</CardTitle>
                        <CardDescription>
                            {t('topEpisodesDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topEpisodes.length > 0 ? (
                                topEpisodes.map((episode, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {episode.name}
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {episode.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-4xl mb-2">🎧</div>
                                    <div>{t('noEpisodesData')}</div>
                                    <div className="text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Import Guide */}
            <DataImportGuide />
        </div>
    )
}

export default Dashboard
