import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Users, Music, Clock, Globe } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { DataImportGuide } from '@/components/DataImportGuide'

const Dashboard = () => {
    const { selectedProfile } = useProfile()
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
    const [topTracks, setTopTracks] = useState<Array<{ name: string, artist: string, plays: number }>>([])
    const [topArtists, setTopArtists] = useState<Array<{ name: string, plays: number }>>([])

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

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-2">
                        Przegląd Twoich statystyk słuchania muzyki
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Całkowite odtworzenia</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalPlays > 0 ? stats.totalPlays.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalPlays > 0 ? 'Od 2017 roku' : 'Brak danych'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Minuty słuchania</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalMinutes > 0 ? stats.totalMinutes.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalMinutes > 0 ? `≈ ${Math.round(stats.totalMinutes / 60)} godzin` : 'Brak danych'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unikalne utwory</CardTitle>
                        <Music className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.uniqueTracks > 0 ? stats.uniqueTracks.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.uniqueTracks > 0 ? 'Różne piosenki' : 'Brak danych'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unikalni artyści</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.uniqueArtists > 0 ? stats.uniqueArtists.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.uniqueArtists > 0 ? 'Różni wykonawcy' : 'Brak danych'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Główny kraj</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.topCountry}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.topCountry !== '——' ? 'Najczęściej słuchasz' : 'Brak danych'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Średnia sesja</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgSessionLength > 0 ? `${stats.avgSessionLength} min` : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.avgSessionLength > 0 ? 'Na sesję' : 'Brak danych'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Tracks */}
                <Card>
                    <CardHeader>
                        <CardTitle>Najczęściej słuchane utwory</CardTitle>
                        <CardDescription>
                            Twoja top 5 piosenek według liczby odtworzeń
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
                                            {track.plays} odtworzeń
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-4xl mb-2">🎵</div>
                                    <div>Brak danych o utworach</div>
                                    <div className="text-sm">Zaimportuj dane ze Spotify</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Artists */}
                <Card>
                    <CardHeader>
                        <CardTitle>Najczęściej słuchani artyści</CardTitle>
                        <CardDescription>
                            Twoja top 5 artystów według liczby odtworzeń
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
                                            {artist.plays} odtworzeń
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <div className="text-4xl mb-2">🎤</div>
                                    <div>Brak danych o artystach</div>
                                    <div className="text-sm">Zaimportuj dane ze Spotify</div>
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
