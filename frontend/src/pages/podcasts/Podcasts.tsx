import React, { useEffect, useState } from 'react'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import PodcastsShowsList from '../../components/podcasts/PodcastsShowsList'
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'

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

interface TimeOfDayStat { hour: number; plays: number; minutes: number }
interface DayOfWeekStat { dow: number; plays: number; minutes: number }

// Removed platform distribution to reduce duplication across pages

// Removed PodcastPlay interface (recent tab removed)

// legacy SpotifyShow interface removed (unused after unification)

const Podcasts: React.FC = () => {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    
    const [loading, setLoading] = useState(false)
    const [overviewStats, setOverviewStats] = useState<PodcastStats | null>(null)
    const [topShows, setTopShows] = useState<TopShow[]>([])
    const [topEpisodes, setTopEpisodes] = useState<TopEpisode[]>([])
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
    const [timeOfDayStats, setTimeOfDayStats] = useState<TimeOfDayStat[]>([])
    const [dayOfWeekStats, setDayOfWeekStats] = useState<DayOfWeekStat[]>([])
    // const [platformStats, setPlatformStats] = useState<PlatformStats[]>([])
    const [error, setError] = useState<string | null>(null)

    // Colors for charts
    // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

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
                fetchDailyStats(),
                fetchTimeOfDay(),
                fetchDayOfWeek()
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

    const fetchDailyStats = async () => {
        if (!selectedProfile) return
        const windows = [30, 180, 365]
        for (const days of windows) {
            try {
                const response = await fetch(`/api/podcasts/daily-stats?profileId=${selectedProfile}&days=${days}`)
                const result: ApiResponse<DailyStats[]> = await response.json()
                if (result.success) {
                    const sumPlays = (result.data || []).reduce((a, d) => a + (d.plays || 0), 0)
                    // Jeśli mamy jakiekolwiek odtworzenia albo to ostatnie okno – użyj
                    if (sumPlays > 0 || days === windows[windows.length - 1]) {
                        setDailyStats(result.data)
                        break
                    }
                }
            } catch (err) {
                console.error(`Error fetching daily stats (${days}d):`, err)
                // jeżeli błąd i to ostatnia próba -> zostaw co jest
                if (days === windows[windows.length - 1]) {
                    setDailyStats([])
                }
            }
        }
    }

    const fetchTimeOfDay = async () => {
        try {
            const response = await fetch(`/api/podcasts/time-of-day?profileId=${selectedProfile}`)
            const result: ApiResponse<TimeOfDayStat[]> = await response.json()
            if (result.success) setTimeOfDayStats(result.data)
        } catch (error) {
            console.error('Error fetching time-of-day:', error)
        }
    }

    const fetchDayOfWeek = async () => {
        try {
            const response = await fetch(`/api/podcasts/day-of-week?profileId=${selectedProfile}`)
            const result: ApiResponse<DayOfWeekStat[]> = await response.json()
            if (result.success) setDayOfWeekStats(result.data)
        } catch (error) {
            console.error('Error fetching day-of-week:', error)
        }
    }

    // Removed platform stats fetch and legacy shows/episodes fetch for tabs; unified list handles its own data

    // helpers removed with recent tab

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

            <Tabs defaultValue="shows" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
                    <TabsTrigger value="shows">
                        <span className="hidden sm:inline">{t('showsAndEpisodes') || 'Shows & Episodes'}</span>
                        <span className="sm:hidden">{t('shows') || 'Shows'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="overview">
                        <span className="hidden sm:inline">{t('overview') || 'Overview'}</span>
                        <span className="sm:hidden">{t('overviewShort') || 'Overview'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts">
                        <span className="hidden sm:inline">{t('charts') || 'Charts'}</span>
                        <span className="sm:hidden">{t('chartsShort') || 'Charts'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights">
                        <span className="hidden sm:inline">{t('insights') || 'Insights'}</span>
                        <span className="sm:hidden">{t('insightsShort') || 'Insights'}</span>
                    </TabsTrigger>
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
                                        <div key={show.id} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                                                    #{index + 1}
                                                </span>
                                                <span className="text-sm truncate" title={show.name}>{show.name}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground flex-shrink-0">
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
                                        <div key={episode.id} className="flex items-center justify-between gap-2">
                                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                                                <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                                                    #{index + 1}
                                                </span>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm truncate" title={episode.name}>{episode.name}</span>
                                                    <span className="text-xs text-muted-foreground truncate" title={episode.showName}>{episode.showName}</span>
                                                </div>
                                            </div>
                                            <span className="text-sm text-muted-foreground flex-shrink-0">
                                                {episode.playCount} plays
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="shows" className="space-y-4">
                    <PodcastsShowsList />
                </TabsContent>

                <TabsContent value="charts" className="space-y-4">
                    {/* Time of Day */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('listeningByHour') || 'Listening by Hour'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={timeOfDayStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} />
                                        <YAxis />
                                        <Tooltip formatter={(value: any, _name: string, item: any) => {
                                            const isPlays = item?.dataKey === 'plays'
                                            const val = isPlays ? value : Number(value).toFixed(1)
                                            return [
                                                `${val} ${isPlays ? (t('plays') || 'plays') : (t('minutes') || 'minutes')}`,
                                                isPlays ? (t('totalPlays') || 'Plays') : (t('totalMinutes') || 'Minutes')
                                            ]
                                        }} />
                                        <Bar name={t('totalPlays') || 'Plays'} dataKey="plays" fill="#8884d8" />
                                        <Bar name={t('totalMinutes') || 'Minutes'} dataKey="minutes" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Day of Week */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('listeningByWeekday') || 'Listening by Weekday'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dayOfWeekStats.map(d => ({ ...d, label: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.dow] }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip formatter={(value: any, _name: string, item: any) => {
                                            const isPlays = item?.dataKey === 'plays'
                                            const val = isPlays ? value : Number(value).toFixed(1)
                                            return [
                                                `${val} ${isPlays ? (t('plays') || 'plays') : (t('minutes') || 'minutes')}`,
                                                isPlays ? (t('totalPlays') || 'Plays') : (t('totalMinutes') || 'Minutes')
                                            ]
                                        }} />
                                        <Bar name={t('totalPlays') || 'Plays'} dataKey="plays" fill="#8884d8" />
                                        <Bar name={t('totalMinutes') || 'Minutes'} dataKey="minutes" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="insights" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('quickInsights') || 'Quick insights'}</CardTitle>
                            <CardDescription>{t('podcastInsightsDescription') || 'Key takeaways from your podcast listening'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(() => {
                                    const days = dailyStats || []
                                    if (!days.length) {
                                        return (
                                            <div className="col-span-full text-muted-foreground text-sm">
                                                {t('noData') || 'No data to display'}
                                            </div>
                                        )
                                    }
                                    const totalDays = days.length
                                    let longest = 0
                                    let current = 0
                                    let maxPlays = 0
                                    let maxPlaysDate = '-'
                                    let activeDays = 0
                                    let maxMinutes = 0
                                    for (const d of days) {
                                        const p = Number(d.plays) || 0
                                        const m = Number(d.minutes) || 0
                                        const hasPlays = p > 0
                                        if (hasPlays) {
                                            current += 1
                                            activeDays += 1
                                        } else {
                                            longest = Math.max(longest, current)
                                            current = 0
                                        }
                                        if (p > maxPlays) {
                                            maxPlays = p
                                            maxPlaysDate = (d as any).date
                                        }
                                        if (m > maxMinutes) maxMinutes = m
                                    }
                                    longest = Math.max(longest, current)
                                    const activePct = totalDays ? Math.round((activeDays / totalDays) * 100) : 0
                                    const totalPlaysActive = days.filter(d => (d.plays || 0) > 0).reduce((a, d) => a + (d.plays || 0), 0)
                                    const totalMinutesActive = days.filter(d => (d.minutes || 0) > 0).reduce((a, d) => a + (Number(d.minutes) || 0), 0)
                                    const avgPlaysActive = activeDays ? Math.round(totalPlaysActive / activeDays) : 0
                                    const avgMinutesActive = activeDays ? Math.round(totalMinutesActive / activeDays) : 0
                                    if (totalPlaysActive === 0) {
                                        return (
                                            <div className="col-span-full text-muted-foreground text-sm">
                                                {t('noData') || 'No data to display'}
                                            </div>
                                        )
                                    }
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
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Podcasts
