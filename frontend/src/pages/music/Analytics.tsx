import { useState, useEffect, lazy, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, PieChart, TrendingUp, Calendar, Music } from 'lucide-react'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'

// Lazy load dużych komponentów
const TracksList = lazy(() => import('@/components/TracksList').then(module => ({ default: module.TracksList })))
const PlaysByCountryChart = lazy(() => import('@/components/charts/StatsCharts').then(module => ({ default: module.PlaysByCountryChart })))
const YearlyStatsChart = lazy(() => import('@/components/charts/StatsCharts').then(module => ({ default: module.YearlyStatsChart })))
const TopArtistsChart = lazy(() => import('@/components/charts/StatsCharts').then(module => ({ default: module.TopArtistsChart })))
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
    const [topArtists, setTopArtists] = useState([])
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

            const [yearlyRes, countryRes, artistsRes, timelineRes] = await Promise.all([
                fetch(`/api/stats/yearly${profileParam}`),
                fetch(`/api/stats/countries${profileParam}`),
                fetch(`/api/artists/top?limit=10${selectedProfile ? `&profileId=${selectedProfile}` : ''}`),
                fetch(`/api/stats/timeline${profileParam}${profileParam ? '&' : '?'}period=day`)
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
                setTopArtists(artistsData.data || [])
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
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>{t('overview')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="flex items-center space-x-2">
                        <PieChart className="h-4 w-4" />
                        <span>{t('charts')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracks" className="flex items-center space-x-2">
                        <Music className="h-4 w-4" />
                        <span>{t('tracksList')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{t('timeline')}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Suspense fallback={<ChartLoader />}>
                            <YearlyStatsChart data={yearlyStats} />
                        </Suspense>
                        <Suspense fallback={<ChartLoader />}>
                            <PlaysByCountryChart data={countryStats} loading={statsLoading} />
                        </Suspense>
                    </div>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Suspense fallback={<ChartLoader />}>
                                <TopArtistsChart data={topArtists} loading={statsLoading} />
                            </Suspense>
                            <Suspense fallback={<ChartLoader />}>
                                <PlaysByCountryChart data={countryStats} loading={statsLoading} />
                            </Suspense>
                        </div>
                        <Suspense fallback={<ChartLoader />}>
                            <YearlyStatsChart data={yearlyStats} />
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

                {/* Timeline Tab */}
                <TabsContent value="timeline">
                    <div className="space-y-6">
                        <Suspense fallback={<ChartLoader />}>
                            <ListeningTimelineChart data={timelineData} />
                        </Suspense>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('listeningPatternsAnalysis')}</CardTitle>
                                <CardDescription>
                                    {t('listeningTrendsDescription')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-spotify-green">
                                            {timelineData.length > 0 ? 
                                                (() => {
                                                    const activeDays = timelineData.filter((day: any) => day.plays > 0)
                                                    const totalPlays = activeDays.reduce((acc: number, day: any) => acc + day.plays, 0)
                                                    return activeDays.length > 0 ? Math.round(totalPlays / activeDays.length) : 0
                                                })() 
                                                : 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('avgPlaysPerActiveDay')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-spotify-green">
                                            {timelineData.length > 0 ? 
                                                (() => {
                                                    const activeDays = timelineData.filter((day: any) => day.minutes > 0)
                                                    const totalMinutes = activeDays.reduce((acc: number, day: any) => acc + day.minutes, 0)
                                                    return activeDays.length > 0 ? Math.round(totalMinutes / activeDays.length) : 0
                                                })() 
                                                : 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('avgMinutesPerActiveDay')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-spotify-green">
                                            {timelineData.length > 0 ? Math.max(...timelineData.map((day: any) => Number(day.minutes) || 0)) : 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{t('longestSession')}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
