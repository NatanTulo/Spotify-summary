import { useState, useEffect, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, PieChart, TrendingUp, Music, Percent } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'

// Lazy load dużych komponentów
const TracksList = lazy(() => import('@/components/TracksList').then(module => ({ default: module.TracksList })))
const PlaysByCountryChart = lazy(() => import('@/components/charts/StatsCharts').then(module => ({ default: module.PlaysByCountryChart })))
const YearlyStatsChart = lazy(() => import('@/components/charts/StatsCharts').then(module => ({ default: module.YearlyStatsChart })))
const ListeningTimelineChart = lazy(() => import('@/components/charts/StatsCharts').then(module => ({ default: module.ListeningTimelineChart })))

// Loading component dla wykresów
const ChartLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
)

interface Track {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
}

interface TopArtist {
    name: string
    plays: number
    minutes: number
}

interface FilterState {
    search: string
    minPlays: number
    dateFrom: string
    dateTo: string
    country: string
    platform: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    showSkipped: boolean
    showShuffle: boolean
}

export default function Analytics() {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    const [tracks, setTracks] = useState<Track[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    })
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        minPlays: 0,
        dateFrom: '',
        dateTo: '',
        country: '',
        platform: '',
        sortBy: 'totalPlays',
        sortOrder: 'desc',
        showSkipped: false,
        showShuffle: false
    })

    // Stats data
    const [yearlyStats, setYearlyStats] = useState([])
    const [countryStats, setCountryStats] = useState([])
    const [timeOfDayStats, setTimeOfDayStats] = useState<Array<{ hour: number; plays: number; totalMinutes: number }>>([])
    const [dayOfWeekStats, setDayOfWeekStats] = useState<Array<{ dow: number; plays: number; totalMinutes: number }>>([])
    const [topArtists, setTopArtists] = useState<TopArtist[]>([])
    const [statsLoading, setStatsLoading] = useState(false)
    const [timelineData, setTimelineData] = useState<Array<{
        date: string
        plays: number
        minutes: number
    }>>([]);
    const [availableCountries] = useState<string[]>([])
    const [availablePlatforms] = useState<string[]>([])

    // Fetch tracks with filters
    const fetchTracks = async (page = 1, limit?: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: (limit || pagination.limit).toString(),
                search: filters.search,
                minPlays: filters.minPlays.toString(),
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                ...(filters.country && { country: filters.country }),
                ...(filters.platform && { platform: filters.platform }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
                ...(selectedProfile && { profileId: selectedProfile })
            })

            const response = await fetch(`/api/tracks?${params}&_t=${Date.now()}`)
            if (response.ok) {
                const data = await response.json()
                setTracks(data.data || [])
                setPagination(data.pagination || pagination)
            }
        } catch (error) {
            console.error('Failed to fetch tracks:', error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch statistics data
    const fetchStats = async () => {
        setStatsLoading(true)
        try {
            const profileParam = selectedProfile ? `?profileId=${selectedProfile}` : ''

            const [yearlyRes, countryRes, artistsRes, timelineRes, timeOfDayRes, dayOfWeekRes] = await Promise.all([
                fetch(`/api/stats/yearly${profileParam}`),
                fetch(`/api/stats/countries${profileParam}`),
                fetch(`/api/artists/top?limit=10${selectedProfile ? `&profileId=${selectedProfile}` : ''}`),
                fetch(`/api/stats/timeline${profileParam}${profileParam ? '&' : '?'}period=day`),
                fetch(`/api/stats/time-of-day${profileParam}`),
                fetch(`/api/stats/day-of-week${profileParam}`)
            ])

            if (yearlyRes.ok) {
                const yearlyData = await yearlyRes.json()
                // Mapowanie danych API na oczekiwaną strukturę komponentu
                const mappedYearlyStats = (yearlyData.data || []).map((stat: any) => ({
                    ...stat,
                    minutes: stat.totalMinutes // Mapowanie totalMinutes -> minutes
                }))
                setYearlyStats(mappedYearlyStats)
            }

            if (countryRes.ok) {
                const countryData = await countryRes.json()
                setCountryStats(countryData.data || [])
            }

            if (artistsRes.ok) {
                const artistsData = await artistsRes.json()
                const mappedTopArtists: TopArtist[] = (artistsData.data || []).map((a: any) => ({
                    name: a.artistName || a.name || 'Unknown',
                    plays: Number(a.totalPlays ?? a.plays ?? 0),
                    minutes: Number(a.totalMinutes ?? a.minutes ?? 0)
                }))
                setTopArtists(mappedTopArtists)
            }

            if (timelineRes.ok) {
                const timelineData = await timelineRes.json()
                const mappedData = (timelineData.data || []).map((item: any) => ({
                    date: item.period,
                    plays: Number(item.plays) || 0,
                    minutes: Number(item.totalMinutes) || 0
                }))
                
                setTimelineData(mappedData)
            } else {
                // Fallback na mock data jeśli endpoint nie działa
                const timeline = generateTimelineData()
                setTimelineData(timeline)
            }

            if (timeOfDayRes.ok) {
                const todData = await timeOfDayRes.json()
                setTimeOfDayStats((todData.data || []).map((d: any) => ({
                    hour: d.hour,
                    plays: Number(d.plays) || 0,
                    totalMinutes: Number(d.totalMinutes) || 0
                })))
            }

            if (dayOfWeekRes.ok) {
                const dowData = await dayOfWeekRes.json()
                setDayOfWeekStats((dowData.data || []).map((d: any) => ({
                    dow: d.dow,
                    plays: Number(d.plays) || 0,
                    totalMinutes: Number(d.totalMinutes) || 0
                })))
            }

        } catch (error) {
            console.error('Failed to fetch stats:', error)
            // Fallback na mock data w przypadku błędu
            const timeline = generateTimelineData()
            setTimelineData(timeline)
        } finally {
            setStatsLoading(false)
        }
    }

    // Generate mock timeline data
    const generateTimelineData = () => {
        const data = []
        const currentDate = new Date()
        for (let i = 30; i >= 0; i--) {
            const date = new Date(currentDate)
            date.setDate(currentDate.getDate() - i)
            data.push({
                date: date.toISOString().split('T')[0],
                plays: Math.floor(Math.random() * 100) + 20,
                minutes: Math.floor(Math.random() * 300) + 60
            })
        }
        return data
    }

    useEffect(() => {
        fetchTracks()
        fetchStats()
    }, [selectedProfile])

    useEffect(() => {
        fetchTracks(1)
    }, [
        filters.search,
        filters.minPlays,
        filters.dateFrom,
        filters.dateTo,
        filters.country,
        filters.platform,
        filters.sortBy,
        filters.sortOrder,
        filters.showSkipped,
        filters.showShuffle
    ])

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }))
        fetchTracks(page)
    }

    const handlePageSizeChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
        fetchTracks(1, newLimit)
    }

    const handleSort = (field: string, order: 'asc' | 'desc') => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: order
        }))
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t('analyticsTitle')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('analyticsDescription')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            fetchTracks()
                            fetchStats()
                        }}
                        className="flex items-center space-x-2"
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span>{t('refreshData')}</span>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tracks" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4">
                    <TabsTrigger value="tracks" className="flex items-center space-x-2">
                        <Music className="h-4 w-4" />
                        <span>{t('tracksList')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>{t('overview')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="flex items-center space-x-2">
                        <PieChart className="h-4 w-4" />
                        <span>{t('charts')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex items-center space-x-2">
                        <Percent className="h-4 w-4" />
                        <span>{t('insights')}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Artists */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('topArtists') || 'Top Artists'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {topArtists.slice(0, 5).map((artist, index) => (
                                        <div key={artist.name} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-sm truncate" title={artist.name}>{artist.name}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground flex-shrink-0">
                                                {artist.plays} plays
                                            </span>
                                        </div>
                                    ))}
                                    {topArtists.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <div className="text-4xl mb-2">🎤</div>
                                            <div>{t('noArtistsData') || 'No artists data'}</div>
                                            <div className="text-sm">{t('importSpotifyData') || 'Import your Spotify data to see statistics'}</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Tracks */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('topTracks') || 'Top Tracks'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {tracks.slice(0, 5).map((track, index) => (
                                        <div key={track.trackId} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                                                    #{index + 1}
                                                </span>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm truncate" title={track.trackName}>{track.trackName}</span>
                                                    <span className="text-xs text-muted-foreground truncate" title={track.artistName}>{track.artistName}</span>
                                                </div>
                                            </div>
                                            <span className="text-sm text-muted-foreground flex-shrink-0">
                                                {track.totalPlays} plays
                                            </span>
                                        </div>
                                    ))}
                                    {tracks.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <div className="text-4xl mb-2">🎵</div>
                                            <div>{t('noTracksData') || 'No tracks data'}</div>
                                            <div className="text-sm">{t('importSpotifyData') || 'Import your Spotify data to see statistics'}</div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts">
                    <div className="space-y-6">
                        {/* Yearly Stats and Country Stats side by side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Suspense fallback={<ChartLoader />}>
                                <YearlyStatsChart data={yearlyStats} />
                            </Suspense>
                            <Suspense fallback={<ChartLoader />}>
                                <PlaysByCountryChart data={countryStats} loading={statsLoading} />
                            </Suspense>
                        </div>
                        {/* Listening by Hour & Weekday stacked full width */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('listeningByHour') || 'Listening by Hour'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timeOfDayStats.map(d => ({
                                            hour: d.hour,
                                            plays: d.plays,
                                            minutes: d.totalMinutes
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="hour" tickFormatter={(v)=> `${v}:00`} />
                                            <YAxis yAxisId="plays" orientation="left" />
                                            <YAxis yAxisId="minutes" orientation="right" />
                                            <Tooltip formatter={(value:any, name:string)=> [value, name==='plays' ? (t('plays')||'Plays') : (t('minutes')||'Minutes')]} />
                                            <Legend />
                                            <Bar yAxisId="plays" dataKey="plays" name={t('totalPlays')||'Plays'} fill="#8884d8" />
                                            <Bar yAxisId="minutes" dataKey="minutes" name={t('totalMinutes')||'Minutes'} fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('listeningByWeekday') || 'Listening by Weekday'}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dayOfWeekStats.map(d => ({
                                            dow: d.dow,
                                            label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.dow],
                                            plays: d.plays,
                                            minutes: d.totalMinutes
                                        }))}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="label" />
                                            <YAxis yAxisId="plays" orientation="left" />
                                            <YAxis yAxisId="minutes" orientation="right" />
                                            <Tooltip formatter={(value:any, name:string)=> [value, name==='plays' ? (t('plays')||'Plays') : (t('minutes')||'Minutes')]} />
                                            <Legend />
                                            <Bar yAxisId="plays" dataKey="plays" name={t('totalPlays')||'Plays'} fill="#8884d8" />
                                            <Bar yAxisId="minutes" dataKey="minutes" name={t('totalMinutes')||'Minutes'} fill="#82ca9d" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Suspense fallback={<ChartLoader />}>
                            <ListeningTimelineChart data={timelineData} />
                        </Suspense>
                    </div>
                </TabsContent>

                {/* Tracks Tab */}
                <TabsContent value="tracks">
                    <div className="space-y-6">
                        <AdvancedFilters
                            filters={filters}
                            onFiltersChange={setFilters}
                            onApply={() => fetchTracks(1)}
                            onReset={() => {
                                setFilters({
                                    search: '',
                                    minPlays: 0,
                                    dateFrom: '',
                                    dateTo: '',
                                    country: '',
                                    platform: '',
                                    sortBy: 'totalPlays',
                                    sortOrder: 'desc',
                                    showSkipped: false,
                                    showShuffle: false
                                })
                                fetchTracks(1)
                            }}
                            countries={availableCountries}
                            platforms={availablePlatforms}
                        />
                        <Suspense fallback={<ChartLoader />}>
                            <TracksList
                                tracks={tracks}
                                loading={loading}
                                profileId={selectedProfile || undefined}
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                onSort={handleSort}
                                currentSort={{
                                    field: filters.sortBy,
                                    order: filters.sortOrder
                                }}
                            />
                        </Suspense>
                    </div>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights">
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('quickInsights') || 'Quick insights'}</CardTitle>
                                <CardDescription>{t('quickInsightsDescription') || 'Highlights based on your recent listening'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {(() => {
                                        const days = timelineData || []
                                        const totalDays = days.length
                                        let longest = 0
                                        let current = 0
                                        let maxPlays = 0
                                        let maxPlaysDate = '-'
                                        let maxMinutes = 0
                                        let activeDays = 0
                                        for (const d of days) {
                                            const hasPlays = (Number((d as any).plays) || 0) > 0
                                            if (hasPlays) {
                                                current += 1
                                                activeDays += 1
                                            } else {
                                                longest = Math.max(longest, current)
                                                current = 0
                                            }
                                            const p = Number((d as any).plays) || 0
                                            const m = Number((d as any).minutes) || 0
                                            if (p > maxPlays) {
                                                maxPlays = p
                                                maxPlaysDate = (d as any).date
                                            }
                                            if (m > maxMinutes) {
                                                maxMinutes = m
                                            }
                                        }
                                        longest = Math.max(longest, current)
                                        const activePct = totalDays ? Math.round((activeDays / totalDays) * 100) : 0
                                        const avgPlaysActive = activeDays ? Math.round(days.filter((d: any) => (d.plays || 0) > 0).reduce((a: number, d: any) => a + (Number(d.plays) || 0), 0) / activeDays) : 0
                                        const avgMinutesActive = activeDays ? Math.round(days.filter((d: any) => (d.minutes || 0) > 0).reduce((a: number, d: any) => a + (Number(d.minutes) || 0), 0) / activeDays) : 0
                                        return (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{longest}</div>
                                                    <div className="text-sm text-muted-foreground">{t('longestStreak') || 'Longest streak (days)'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{current}</div>
                                                    <div className="text-sm text-muted-foreground">{t('currentStreak') || 'Current streak (days)'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{activePct}%</div>
                                                    <div className="text-sm text-muted-foreground">{t('activeDaysRatio') || 'Active days (last period)'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{maxPlays}</div>
                                                    <div className="text-sm text-muted-foreground">{t('peakDayPlays') || `Peak day plays (${maxPlaysDate})`}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{avgPlaysActive}</div>
                                                    <div className="text-sm text-muted-foreground">{t('avgPlaysActiveDay') || 'Avg plays per active day'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{avgMinutesActive}</div>
                                                    <div className="text-sm text-muted-foreground">{t('avgMinutesActiveDay') || 'Avg minutes per active day'}</div>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('listeningBehavior') || 'Listening Behavior'}</CardTitle>
                                <CardDescription>{t('musicInsightsMore') || 'Concentration and distribution of your listening'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(() => {
                                        const totalPlays = (topArtists || []).reduce((a: number, x: TopArtist) => a + (Number(x.plays) || 0), 0)
                                        const top1 = topArtists && topArtists[0] ? Math.round(((Number(topArtists[0].plays) || 0) / (totalPlays || 1)) * 100) : 0
                                        const top3sum = (topArtists || []).slice(0,3).reduce((a: number, x: TopArtist) => a + (Number(x.plays) || 0), 0)
                                        const top3 = Math.round(((top3sum) / (totalPlays || 1)) * 100)
                                        // YoY change using last two years if available
                                        let yoy = 0
                                        if ((yearlyStats as any[])?.length >= 2) {
                                            const sorted = [...(yearlyStats as any[])].sort((a,b) => Number(a.year) - Number(b.year))
                                            const last = sorted[sorted.length - 1]
                                            const prev = sorted[sorted.length - 2]
                                            const lastMinutes = Number((last as any).minutes) || 0
                                            const prevMinutes = Number((prev as any).minutes) || 0
                                            yoy = prevMinutes ? Math.round(((lastMinutes - prevMinutes) / prevMinutes) * 100) : 0
                                        }
                                        // Dominant country share
                                        const totalCountryPlays = (countryStats || []).reduce((a: number, x: any) => a + (Number(x.plays) || 0), 0)
                                        const maxCountry = (countryStats || []).reduce((max: number, x: any) => Math.max(max, Number(x.plays) || 0), 0)
                                        const domCountry = Math.round(((maxCountry) / (totalCountryPlays || 1)) * 100)
                                        return (
                                            <>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{top1}%</div>
                                                    <div className="text-sm text-muted-foreground">{t('topArtistShare') || 'Top artist share'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{top3}%</div>
                                                    <div className="text-sm text-muted-foreground">{t('top3Share') || 'Top 3 artists share'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className={`text-2xl font-bold ${yoy >= 0 ? 'text-spotify-green' : 'text-destructive'}`}>{yoy}%</div>
                                                    <div className="text-sm text-muted-foreground">{t('yoyChange') || 'YoY change (minutes)'}</div>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-2xl font-bold text-primary">{domCountry}%</div>
                                                    <div className="text-sm text-muted-foreground">{t('dominantCountryShare') || 'Dominant country share'}</div>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
