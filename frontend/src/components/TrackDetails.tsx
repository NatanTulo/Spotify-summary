import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ArrowLeft, Play, Clock, Hash, Shuffle, WifiOff, EyeOff } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from '../context/LanguageContext'

interface TrackDetailsProps {
    trackId: string
    profileId?: string
    onBack: () => void
}

interface DetailedTrack {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    uri?: string
    duration?: number
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
    platforms?: string[]
    countries?: string[]
    firstPlay?: Date
    lastPlay?: Date
    username?: string
    reasonStart?: string[]
    reasonEnd?: string[]
    shuffle?: boolean | null
    offline?: boolean | null
    incognitoMode?: boolean | null
}

interface Play {
    id: string
    playedAt: Date | string // API returns string, but can be Date after parsing
    msPlayed: number
    durationMinutes: number
    platform?: string
    country?: string
    username?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    offline?: boolean
    incognitoMode?: boolean
    skipped?: boolean
}

// Timeline cache to prevent repeated requests
const timelineCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function TrackDetails({ trackId, profileId, onBack }: TrackDetailsProps) {
    const { t, formatDate: localizedFormatDate } = useLanguage()
    const [track, setTrack] = useState<DetailedTrack | null>(null)
    const [plays, setPlays] = useState<Play[]>([])
    const [timelineData, setTimelineData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [timelineLoading, setTimelineLoading] = useState(true)
    const [playsLoading, setPlaysLoading] = useState(false)
    const [playsPagination, setPlaysPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    })

    useEffect(() => {
        fetchTrackDetails()
        fetchTrackPlays()
        // Timeline is loaded separately and can be cached
        fetchTrackTimeline()
    }, [trackId, profileId])

    const fetchTrackDetails = async () => {
        try {
            const response = await fetch(`/api/tracks/${trackId}`)
            if (response.ok) {
                const data = await response.json()
                const rawTrack = data.data
                
                // Map API response to expected format
                const mappedTrack: DetailedTrack = {
                    trackId: rawTrack.id.toString(),
                    trackName: rawTrack.name,
                    artistName: rawTrack.album?.artist?.name || '',
                    albumName: rawTrack.album?.name || '',
                    uri: rawTrack.uri,
                    duration: rawTrack.duration,
                    totalPlays: rawTrack.stats?.totalPlays || 0,
                    totalMinutes: rawTrack.stats?.totalMinutes || 0,
                    avgPlayDuration: rawTrack.stats?.avgPlayDuration || 0,
                    skipPercentage: rawTrack.stats?.skipPercentage || 0,
                    // Extract platforms and countries from recent plays
                    platforms: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.platform).filter(Boolean))] as string[] : [],
                    countries: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.country).filter(Boolean))] as string[] : [],
                    // Get first and last play dates from stats (aggregated data)
                    firstPlay: rawTrack.stats?.firstPlay ? new Date(rawTrack.stats.firstPlay) : undefined,
                    lastPlay: rawTrack.stats?.lastPlay ? new Date(rawTrack.stats.lastPlay) : undefined,
                    // Extract other fields from recent plays (take most common values)
                    username: rawTrack.recentPlays?.[0]?.profile?.name,
                    reasonStart: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.reasonStart).filter(Boolean))] as string[] : [],
                    reasonEnd: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.reasonEnd).filter(Boolean))] as string[] : [],
                    shuffle: rawTrack.recentPlays?.[0]?.shuffle,
                    offline: rawTrack.recentPlays?.[0]?.offline,
                    incognitoMode: rawTrack.recentPlays?.[0]?.incognitoMode,
                }
                
                setTrack(mappedTrack)
            }
        } catch (error) {
            console.error('Error fetching track details:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchTrackTimeline = async () => {
        try {
            setTimelineLoading(true)
            
            // Check cache first
            const cacheKey = `${trackId}-${profileId || 'all'}`
            const cached = timelineCache.get(cacheKey)
            
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                setTimelineData(cached.data)
                setTimelineLoading(false)
                return
            }

            const params = new URLSearchParams()
            if (profileId) {
                params.append('profileId', profileId)
            }

            // Add timeout for request
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const response = await fetch(`/api/tracks/${trackId}/timeline?${params}`, {
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)

            if (response.ok) {
                const data = await response.json()
                const timelineData = data.data || []
                setTimelineData(timelineData)
                
                // Cache the result
                timelineCache.set(cacheKey, {
                    data: timelineData,
                    timestamp: Date.now()
                })
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Timeline request was aborted due to timeout')
            } else {
                console.error('Error fetching track timeline:', error)
            }
        } finally {
            setTimelineLoading(false)
        }
    }

    const fetchTrackPlays = async (page = 1) => {
        try {
            setPlaysLoading(true)
            const params = new URLSearchParams()
            if (profileId) {
                params.append('profileId', profileId)
            }
            params.append('page', page.toString())
            params.append('limit', '50')

            const response = await fetch(`/api/tracks/${trackId}/plays?${params}`)
            if (response.ok) {
                const data = await response.json()
                setPlays(data.data || [])
                setPlaysPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 0 })
            }
        } catch (error) {
            console.error('Error fetching track plays:', error)
        } finally {
            setPlaysLoading(false)
            setLoading(false)
        }
    }

    const formatDuration = (ms?: number) => {
        if (!ms) return t('notAvailable')
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    if (loading || !track) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">{t('loading')}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header z przyciskiem powrotu */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t('back')}
                </button>
                <div>
                    <h1 className="text-2xl font-bold">{track.trackName}</h1>
                    <p className="text-muted-foreground">{track.artistName} • {track.albumName}</p>
                </div>
            </div>

            {/* Podstawowe informacje */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalPlays')}</CardTitle>
                        <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(track.totalPlays || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalMinutes')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(track.totalMinutes || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            ≈ {Math.round((track.totalMinutes || 0) / 60)} {t('hours')}
                        </p>
                    </CardContent>
                </Card>                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('avgPlayDuration')}</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration((track.avgPlayDuration || 0) * 1000)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('skipPercentage')}</CardTitle>
                        <Hash className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(track.skipPercentage || 0) > 50 ? 'text-red-500' :
                            (track.skipPercentage || 0) > 20 ? 'text-yellow-500' :
                                'text-green-500'
                            }`}>
                            {(track.skipPercentage || 0).toFixed(1)}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Timeline odtworzeń */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('timelineTitle')}</CardTitle>
                    <CardDescription>{t('playHistoryDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {timelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={timelineData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: 'hsl(var(--foreground))' }}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                />
                                <YAxis
                                    tick={{ fill: 'hsl(var(--foreground))' }}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                />
                                <Tooltip
                                    formatter={(value: any) => [value, t('plays')]}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                />
                                <Bar dataKey="plays" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                            {timelineLoading ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            ) : (
                                t('noTimelineData')
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* Lista szczegółowych odtworzeń */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('playHistory')}</CardTitle>
                    <CardDescription>{t('playHistoryDesc')}</CardDescription>
                </CardHeader>

                <CardContent>
                        {playsLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2 text-sm text-muted-foreground">{t('loadingHistory')}</p>
                            </div>
                        ) : plays.length > 0 ? (
                            <>
                                <div className="space-y-2">
                                    {plays.map((play) => (
                                        <div key={play.id} className="border rounded-lg p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <div className="font-medium">
                                                            {play.playedAt ? localizedFormatDate(play.playedAt, true) : t('notAvailable')}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {play.durationMinutes} min • {play.platform} • {play.country}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {play.shuffle && (
                                                        <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                                            <Shuffle className="h-3 w-3" />
                                                            {t('shuffleLabel')}
                                                        </div>
                                                    )}
                                                    {play.offline && (
                                                        <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                            <WifiOff className="h-3 w-3" />
                                                            {t('offlineLabel')}
                                                        </div>
                                                    )}
                                                    {play.incognitoMode && (
                                                        <div className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                                                            <EyeOff className="h-3 w-3" />
                                                            {t('incognitoLabel')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(play.reasonStart || play.reasonEnd) && (
                                                <div className="text-xs text-muted-foreground border-t pt-2">
                                                    {play.reasonStart && (
                                                        <div>{t('startReason')} {play.reasonStart}</div>
                                                    )}
                                                    {play.reasonEnd && (
                                                        <div>{t('endReason')} {play.reasonEnd}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {playsPagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-4">
                                        <button
                                            onClick={() => fetchTrackPlays(playsPagination.page - 1)}
                                            disabled={playsPagination.page <= 1}
                                            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        >
                                            {t('previous')}
                                        </button>
                                        <span className="text-sm">
                                            {t('pageLabel')} {playsPagination.page} {t('fromLabel')} {playsPagination.pages}
                                        </span>
                                        <button
                                            onClick={() => fetchTrackPlays(playsPagination.page + 1)}
                                            disabled={playsPagination.page >= playsPagination.pages}
                                            className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        >
                                            {t('next')}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                {t('noPlaysFound')}
                            </div>
                        )}
                </CardContent>
            </Card>
        </div>
    )
}
