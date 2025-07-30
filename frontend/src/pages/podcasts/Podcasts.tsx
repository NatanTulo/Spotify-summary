import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'

interface SpotifyShow {
    id: string
    name: string
    description?: string
}

interface SpotifyEpisode {
    id: string
    name: string
    showId: string
    spotifyUri?: string
    description?: string
    show?: SpotifyShow
}

interface PodcastStats {
    totalPodcastPlays: number
    totalPodcastMinutes: number
    uniqueShows: number
    uniqueEpisodes: number
}

interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

interface PodcastStatsResponse {
    overview: PodcastStats
    topShows: Array<{
        id: string
        name: string
        playCount: number
        totalTime: number
    }>
}

const VideoPodcasts: React.FC = () => {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    const [loading, setLoading] = useState(true)
    const [podcastStats, setPodcastStats] = useState<PodcastStatsResponse | null>(null)
    const [shows, setShows] = useState<SpotifyShow[]>([])
    const [selectedShow, setSelectedShow] = useState<SpotifyShow | null>(null)
    const [episodes, setEpisodes] = useState<SpotifyEpisode[]>([])

    const fetchPodcastStats = async () => {
        // Jeśli nie ma wybranego profilu, nie pobieraj statystyk
        if (!selectedProfile) {
            setPodcastStats(null)
            return
        }

        try {
            const response = await fetch(`/api/video/video-stats?profileId=${selectedProfile}`)
            const result: ApiResponse<PodcastStatsResponse> = await response.json()
            
            if (result.success) {
                setPodcastStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching podcast stats:', error)
        }
    }

    const fetchShows = async () => {
        if (!selectedProfile) return

        try {
            const response = await fetch(`/api/video/shows?profileId=${selectedProfile}&limit=100`)
            const result: ApiResponse<SpotifyShow[]> = await response.json()
            
            if (result.success && result.data && Array.isArray(result.data)) {
                setShows(result.data)
            } else {
                console.warn('Invalid shows data received:', result)
                setShows([]) // Ustaw pustą tablicę jako fallback
            }
        } catch (error) {
            console.error('Error fetching shows:', error)
            setShows([]) // Ustaw pustą tablicę w przypadku błędu
        }
    }

    const fetchEpisodes = async (showId: string) => {
        if (!selectedProfile) return

        try {
            const response = await fetch(`/api/video/shows/${showId}/episodes?profileId=${selectedProfile}&limit=100`)
            const result: ApiResponse<SpotifyEpisode[]> = await response.json()
            
            if (result.success && result.data && Array.isArray(result.data)) {
                setEpisodes(result.data)
            } else {
                console.warn('Invalid episodes data received:', result)
                setEpisodes([]) // Ustaw pustą tablicę jako fallback
            }
        } catch (error) {
            console.error('Error fetching episodes:', error)
            setEpisodes([]) // Ustaw pustą tablicę w przypadku błędu
        }
    }

    useEffect(() => {
        if (selectedProfile) {
            setLoading(true)
            Promise.all([
                fetchPodcastStats(),
                fetchShows()
            ]).finally(() => setLoading(false))
        }
    }, [selectedProfile])

    useEffect(() => {
        if (selectedShow) {
            fetchEpisodes(selectedShow.id)
        }
    }, [selectedShow])

    const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const hours = Math.floor(minutes / 60)
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`
        }
        return `${minutes}m`
    }

    if (!selectedProfile) {
        return (
            <div className="p-6">
                <div className="text-center text-gray-500">
                    {t('selectProfileForVideo')}
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-500">{t('loading')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col space-y-4">
                <h1 className="text-3xl font-bold">{t('videoPodcastsTitle')}</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('videoPodcastsDescription')}
                </p>
            </div>

            {/* Overview Stats */}
            {podcastStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-primary">
                            {podcastStats.overview.totalPodcastPlays.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t('videoPlaysStats')}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-primary">
                            {podcastStats.overview.totalPodcastMinutes.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t('videoMinutesStats')}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-primary">
                            {podcastStats.overview.uniqueShows}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t('uniqueShowsStats')}
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-2xl font-bold text-primary">
                            {podcastStats.overview.uniqueEpisodes}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t('uniqueEpisodesStats')}
                        </div>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="shows" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="shows">{t('showsTab')}</TabsTrigger>
                    <TabsTrigger value="topShows">{t('topShowsTab')}</TabsTrigger>
                    <TabsTrigger value="episodes">{t('episodesTab')}</TabsTrigger>
                </TabsList>

                <TabsContent value="shows" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{t('allShows')}</h3>
                        <div className="grid gap-2 max-h-96 overflow-y-auto">
                            {shows && Array.isArray(shows) ? shows.map((show) => (
                                <div
                                    key={show.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedShow?.id === show.id
                                            ? 'bg-primary/10 border-primary'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                    onClick={() => setSelectedShow(show)}
                                >
                                    <div className="font-medium">{show.name}</div>
                                    {show.description && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {show.description}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-8">
                                    {t('noDataState')}
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="topShows" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">{t('topShowsTitle')}</h3>
                        <div className="space-y-3">
                            {podcastStats?.topShows && Array.isArray(podcastStats.topShows) ? podcastStats.topShows.map((show, index) => (
                                <div key={show.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-lg font-bold text-primary">#{index + 1}</div>
                                        <div>
                                            <div className="font-medium">{show.name}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {show.playCount} {t('playCount')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium">{formatDuration(show.totalTime)}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {t('videoTotalTime')}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-8">
                                    {t('noDataState')}
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="episodes" className="space-y-4">
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedShow 
                                ? `${t('episodesFor')} ${selectedShow.name}`
                                : t('selectShowForEpisodes')
                            }
                        </h3>
                        {selectedShow && (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {episodes && Array.isArray(episodes) ? episodes.map((episode) => (
                                    <div key={episode.id} className="p-3 rounded-lg border">
                                        <div className="font-medium">{episode.name}</div>
                                        {episode.description && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {episode.description}
                                            </div>
                                        )}
                                        {episode.spotifyUri && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                URI: {episode.spotifyUri}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center text-gray-500 py-8">
                                        {t('noDataState')}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default VideoPodcasts
