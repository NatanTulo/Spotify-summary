import { useState, useEffect } from 'react'
import { ArrowLeft, Play } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { useLanguage } from '../../context/LanguageContext'

interface EpisodePlay {
    id: number
    timestamp: string
    msPlayed: number
    platform?: string
    country?: string
    shuffle?: boolean
    offline?: boolean
    skipped?: boolean
    incognitoMode?: boolean
    reasonStart?: string
    reasonEnd?: string
    episode: {
        name: string
        show?: {
            name: string
            publisher?: string
        }
    }
}

interface EpisodeDetailsProps {
    episodeId: number
    episodeName: string
    showName: string
    profileId: string
    onBack: () => void
}

export function EpisodeDetails({ episodeId, episodeName, showName, profileId, onBack }: EpisodeDetailsProps) {
    const { t } = useLanguage()
    const [plays, setPlays] = useState<EpisodePlay[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchEpisodePlays()
    }, [episodeId, profileId])

    const fetchEpisodePlays = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/podcasts/${profileId}/episode/${episodeId}/plays`)
            if (!response.ok) {
                throw new Error('Failed to fetch episode plays')
            }

            const data = await response.json()
            if (data.success) {
                setPlays(data.data.plays)
            } else {
                throw new Error(data.error || 'Failed to fetch episode plays')
            }
        } catch (err) {
            console.error('Error fetching episode plays:', err)
            setError(err instanceof Error ? err.message : 'Unknown error occurred')
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (msPlayed: number) => {
        const minutes = Math.floor(msPlayed / 60000)
        const seconds = Math.floor((msPlayed % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const getTotalStats = () => {
        const totalPlays = plays.length
        const totalMinutes = Math.round(plays.reduce((sum, play) => sum + play.msPlayed, 0) / 60000)
        const avgDuration = totalPlays > 0 ? Math.round(plays.reduce((sum, play) => sum + play.msPlayed, 0) / totalPlays / 60000) : 0
        
        return { totalPlays, totalMinutes, avgDuration }
    }

    const stats = getTotalStats()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('back') || 'Back'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        {episodeName}
                    </CardTitle>
                    <CardDescription>
                        {showName} • {stats.totalPlays} {t('totalPlays') || 'plays'} • {stats.totalMinutes} {t('minutes') || 'minutes'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Stats Overview */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{stats.totalPlays}</div>
                            <div className="text-sm text-muted-foreground">{t('totalPlays') || 'Total Plays'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{stats.totalMinutes}</div>
                            <div className="text-sm text-muted-foreground">{t('totalMinutes') || 'Total Minutes'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{stats.avgDuration}</div>
                            <div className="text-sm text-muted-foreground">{t('avgTime') || 'Avg Duration'} (min)</div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground">{t('loading') || 'Loading...'}</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {plays.map((play) => (
                                <div key={play.id} className="p-4 rounded-lg border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{formatDate(play.timestamp)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t('duration') || 'Duration'}: {formatDuration(play.msPlayed)}
                                            </p>
                                            {play.platform && (
                                                <p className="text-sm text-muted-foreground">
                                                    {t('platform') || 'Platform'}: {play.platform}
                                                </p>
                                            )}
                                            {play.country && (
                                                <p className="text-sm text-muted-foreground">
                                                    {t('country') || 'Country'}: {play.country}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {play.skipped && <span className="text-orange-500">⏭ {t('skipped') || 'Skipped'}</span>}
                                            {play.offline && <span className="text-blue-500">📱 {t('offline') || 'Offline'}</span>}
                                            {play.shuffle && <span className="text-blue-500">🔀 {t('shuffle') || 'Shuffle'}</span>}
                                            {play.incognitoMode && <span className="text-purple-500">🕵️ {t('incognitoMode') || 'Incognito'}</span>}
                                        </div>
                                    </div>
                                    {(play.reasonStart || play.reasonEnd) && (
                                        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                            {play.reasonStart && (
                                                <div>{t('startReason') || 'Start'}: {play.reasonStart}</div>
                                            )}
                                            {play.reasonEnd && (
                                                <div>{t('endReason') || 'End'}: {play.reasonEnd}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && plays.length === 0 && (
                        <p className="text-muted-foreground text-center py-8">
                            {t('noPlaysFound') || 'No plays found for this episode'}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default EpisodeDetails
