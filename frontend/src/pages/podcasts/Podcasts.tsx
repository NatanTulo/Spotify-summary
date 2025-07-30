import React, { useEffect, useState } from 'react'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

interface ApiResponse<T> {
    success: boolean
    data: T
    error?: string
}

interface PodcastStats {
    totalPodcastPlays: number
    totalPodcastMinutes: number
    uniqueShows: number
    uniqueEpisodes: number
}

interface TopShow {
    id: string
    name: string
    playCount: number
    totalTime: number
    publisher?: string
}

interface TopEpisode {
    id: string
    name: string
    showName: string
    playCount: number
    totalTime: number
    releaseDate?: string
}

interface DailyStats {
    date: string
    plays: number
    minutes: number
}

interface PlatformStats {
    platform: string
    plays: number
    percentage: number
}

interface PodcastPlay {
    id: string
    ts: string
    episodeName: string
    showName: string
    msPlayed: number
    reasonStart: string
    reasonEnd: string
    platform: string
    episodeUri: string
    episodeShowUri: string
}

interface SpotifyShow {
    id: string
    name: string
    description?: string
    publisher?: string
    totalEpisodes?: number
    totalPlays?: number
    totalMinutes?: number
}

const Podcasts: React.FC = () => {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    
    const [loading, setLoading] = useState(false)
    const [overviewStats, setOverviewStats] = useState<PodcastStats | null>(null)
    const [topShows, setTopShows] = useState<TopShow[]>([])
    const [topEpisodes, setTopEpisodes] = useState<TopEpisode[]>([])
    const [recentPlays, setRecentPlays] = useState<PodcastPlay[]>([])
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
    const [platformStats, setPlatformStats] = useState<PlatformStats[]>([])
    const [shows, setShows] = useState<SpotifyShow[]>([])
    const [selectedShow, setSelectedShow] = useState<SpotifyShow | null>(null)
    const [showEpisodes, setShowEpisodes] = useState<PodcastPlay[]>([])
    const [error, setError] = useState<string | null>(null)

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

    useEffect(() => {
        if (selectedProfile) {
            fetchData()
        }
    }, [selectedProfile])

    const fetchData = async () => {
        if (!selectedProfile) return

        setLoading(true)
        setError(null)

        try {
            await Promise.all([
                fetchOverviewStats(),
                fetchTopShows(),
                fetchTopEpisodes(),
                fetchRecentPlays(),
                fetchDailyStats(),
                fetchPlatformStats(),
                fetchShows()
            ])
        } catch (err) {
            console.error('Error fetching podcast data:', err)
            setError('Failed to load podcast data')
        } finally {
            setLoading(false)
        }
    }

    const fetchOverviewStats = async () => {
        try {
            const response = await fetch(`/api/podcasts/stats?profileId=${selectedProfile}`)
            const result: ApiResponse<PodcastStats> = await response.json()
            
            if (result.success) {
                setOverviewStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching overview stats:', error)
        }
    }

    const fetchTopShows = async () => {
        try {
            const response = await fetch(`/api/podcasts/top-shows?profileId=${selectedProfile}&limit=10`)
            const result: ApiResponse<TopShow[]> = await response.json()
            
            if (result.success) {
                setTopShows(result.data)
            }
        } catch (error) {
            console.error('Error fetching top shows:', error)
        }
    }

    const fetchTopEpisodes = async () => {
        try {
            const response = await fetch(`/api/podcasts/top-episodes?profileId=${selectedProfile}&limit=20`)
            const result: ApiResponse<TopEpisode[]> = await response.json()
            
            if (result.success) {
                setTopEpisodes(result.data)
            }
        } catch (error) {
            console.error('Error fetching top episodes:', error)
        }
    }

    const fetchRecentPlays = async () => {
        try {
            const response = await fetch(`/api/podcasts/recent-plays?profileId=${selectedProfile}&limit=50`)
            const result: ApiResponse<PodcastPlay[]> = await response.json()
            
            if (result.success) {
                setRecentPlays(result.data)
            }
        } catch (error) {
            console.error('Error fetching recent plays:', error)
        }
    }

    const fetchDailyStats = async () => {
        try {
            const response = await fetch(`/api/podcasts/daily-stats?profileId=${selectedProfile}&days=30`)
            const result: ApiResponse<DailyStats[]> = await response.json()
            
            if (result.success) {
                setDailyStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching daily stats:', error)
        }
    }

    const fetchPlatformStats = async () => {
        try {
            const response = await fetch(`/api/podcasts/platform-stats?profileId=${selectedProfile}`)
            const result: ApiResponse<PlatformStats[]> = await response.json()
            
            if (result.success) {
                setPlatformStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching platform stats:', error)
        }
    }

    const fetchShows = async () => {
        try {
            const response = await fetch(`/api/podcasts/shows?profileId=${selectedProfile}&limit=100`)
            const result: ApiResponse<SpotifyShow[]> = await response.json()
            
            if (result.success && Array.isArray(result.data)) {
                setShows(result.data)
            }
        } catch (error) {
            console.error('Error fetching shows:', error)
        }
    }

    const fetchShowEpisodes = async (showId: string) => {
        try {
            const response = await fetch(`/api/podcasts/shows/${showId}/episodes?profileId=${selectedProfile}&limit=50`)
            const result: ApiResponse<PodcastPlay[]> = await response.json()
            
            if (result.success && Array.isArray(result.data)) {
                setShowEpisodes(result.data)
            }
        } catch (error) {
            console.error('Error fetching show episodes:', error)
        }
    }

    const handleShowSelect = (show: SpotifyShow) => {
        setSelectedShow(show)
        fetchShowEpisodes(show.id)
    }

    const formatDuration = (ms: number): string => {
        const minutes = Math.floor(ms / 60000)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`
        }
        return `${minutes}m`
    }

    const formatTime = (dateString: string): string => {
        return new Date(dateString).toLocaleString()
    }

    if (!selectedProfile) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('podcastsTitle') || 'Podcasts'}</h1>
                    <p className="text-muted-foreground">{t('selectProfile') || 'Please select a profile to view podcast data'}</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('podcastsTitle') || 'Podcasts'}</h1>
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('podcastsTitle') || 'Podcasts'}</h1>
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg">
                        {error}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold">{t('podcastsTitle') || 'Podcasts'}</h1>
                <p className="text-muted-foreground">
                    {t('podcastsDescription') || 'Explore your podcast listening history and statistics'}
                </p>
            </div>

            {/* Overview Stats */}
            {overviewStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-primary">
                                {overviewStats.totalPodcastPlays.toLocaleString()}
                            </CardTitle>
                            <CardDescription>
                                {t('totalPlays') || 'Total Plays'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-primary">
                                {overviewStats.totalPodcastMinutes.toLocaleString()}
                            </CardTitle>
                            <CardDescription>
                                {t('totalMinutes') || 'Total Minutes'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-primary">
                                {overviewStats.uniqueShows}
                            </CardTitle>
                            <CardDescription>
                                {t('uniqueShows') || 'Unique Shows'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-2xl font-bold text-primary">
                                {overviewStats.uniqueEpisodes}
                            </CardTitle>
                            <CardDescription>
                                {t('uniqueEpisodes') || 'Unique Episodes'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">{t('overview') || 'Overview'}</TabsTrigger>
                    <TabsTrigger value="top-shows">{t('topShows') || 'Top Shows'}</TabsTrigger>
                    <TabsTrigger value="episodes">{t('episodes') || 'Episodes'}</TabsTrigger>
                    <TabsTrigger value="recent">{t('recent') || 'Recent'}</TabsTrigger>
                    <TabsTrigger value="charts">{t('charts') || 'Charts'}</TabsTrigger>
                    <TabsTrigger value="platforms">{t('platforms') || 'Platforms'}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Shows */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('topShows') || 'Top Shows'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {topShows.slice(0, 5).map((show, index) => (
                                        <div key={show.id} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-sm truncate">{show.name}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {show.playCount} plays
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Episodes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('topEpisodes') || 'Top Episodes'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {topEpisodes.slice(0, 5).map((episode, index) => (
                                        <div key={episode.id} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    #{index + 1}
                                                </span>
                                                <div className="flex flex-col">
                                                    <span className="text-sm truncate">{episode.name}</span>
                                                    <span className="text-xs text-muted-foreground">{episode.showName}</span>
                                                </div>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {episode.playCount} plays
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="top-shows" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('topShows') || 'Top Shows'}</CardTitle>
                            <CardDescription>
                                {t('topShowsDescription') || 'Your most listened to podcast shows'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {topShows.map((show, index) => (
                                    <div key={show.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-2xl font-bold text-primary">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{show.name}</h3>
                                                {show.publisher && (
                                                    <p className="text-sm text-muted-foreground">{show.publisher}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{show.playCount} plays</div>
                                            <div className="text-sm text-muted-foreground">
                                                {formatDuration(show.totalTime)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="episodes" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Shows List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('shows') || 'Shows'}</CardTitle>
                                <CardDescription>
                                    {t('selectShowToViewEpisodes') || 'Select a show to view episodes'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {shows.map((show) => (
                                        <div
                                            key={show.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                                selectedShow?.id === show.id
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'hover:bg-muted/50'
                                            }`}
                                            onClick={() => handleShowSelect(show)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">{show.name}</h4>
                                                    {show.publisher && (
                                                        <p className="text-sm text-muted-foreground">{show.publisher}</p>
                                                    )}
                                                </div>
                                                {show.totalPlays && (
                                                    <span className="text-sm text-muted-foreground">
                                                        {show.totalPlays} plays
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Episodes List */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {selectedShow 
                                        ? `${t('episodesFor') || 'Episodes for'} ${selectedShow.name}`
                                        : t('selectShowForEpisodes') || 'Select a show to view episodes'
                                    }
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {selectedShow ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {showEpisodes.map((episode) => (
                                            <div key={episode.id} className="p-3 border rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm">{episode.episodeName}</h4>
                                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                                            <span>{formatTime(episode.ts)}</span>
                                                            <span>•</span>
                                                            <span>{formatDuration(episode.msPlayed)}</span>
                                                            <span>•</span>
                                                            <span>{episode.platform}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {showEpisodes.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8">
                                                {t('noEpisodesFound') || 'No episodes found for this show'}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                        {t('selectShowMessage') || 'Select a show from the list to view episodes'}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('recentPlays') || 'Recent Plays'}</CardTitle>
                            <CardDescription>
                                {t('recentPlaysDescription') || 'Your recently played podcast episodes'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentPlays.map((play) => (
                                    <div key={play.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{play.episodeName}</h4>
                                            <p className="text-sm text-muted-foreground">{play.showName}</p>
                                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                                <span>{formatTime(play.ts)}</span>
                                                <span>•</span>
                                                <span>{play.platform}</span>
                                                <span>•</span>
                                                <span>{play.reasonStart} → {play.reasonEnd}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">
                                                {formatDuration(play.msPlayed)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="charts" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Daily Listening Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('dailyListening') || 'Daily Listening (Last 30 Days)'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={dailyStats}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip 
                                                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                                formatter={(value: any, name: string) => [
                                                    name === 'plays' ? `${value} plays` : `${value} minutes`,
                                                    name === 'plays' ? 'Plays' : 'Minutes'
                                                ]}
                                            />
                                            <Line type="monotone" dataKey="plays" stroke="#8884d8" strokeWidth={2} />
                                            <Line type="monotone" dataKey="minutes" stroke="#82ca9d" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Platform Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('platformDistribution') || 'Platform Distribution'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={platformStats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.platform} (${entry.percentage.toFixed(1)}%)`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="plays"
                                            >
                                                {platformStats.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => [`${value} plays`, 'Plays']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="platforms" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('platforms') || 'Platforms'}</CardTitle>
                            <CardDescription>
                                {t('platformsDescription') || 'Breakdown of your podcast listening by platform'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {platformStats.map((platform, index) => (
                                    <div key={platform.platform} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div 
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <div>
                                                <h3 className="font-medium">{platform.platform}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {platform.percentage.toFixed(1)}% of total plays
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{platform.plays.toLocaleString()} plays</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Podcasts
