import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useLanguage } from '../context/LanguageContext'
import { useTrackDetails } from '../hooks/useTrackDetails'
import { TrackHeader } from './tracks/details/TrackHeader'
import { TrackStats } from './tracks/details/TrackStats'
import { TrackTimeline } from './tracks/TrackTimeline'
import { TrackRecentPlays } from './tracks/details/TrackRecentPlays'
interface TrackDetailsProps {
    trackId: string
    profileId?: string
    onBack: () => void
    inline?: boolean
}
export function TrackDetails({ trackId, profileId, onBack, inline = false }: TrackDetailsProps) {
    const { t, language } = useLanguage()
    const {
        error, retry, timelineError, retryTimeline, playsError, retryPlays,
        track,
        plays,
        timelineData,
        loading,
        timelineLoading,
        playsLoading,
        playsPagination,
        fetchTrackPlays
    } = useTrackDetails(trackId, profileId)
    if (loading) {
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
    if (error || !track) return <div role="alert" className="space-y-3 py-8 text-center"><p>{language === 'pl' ? 'Nie udało się pobrać szczegółów utworu.' : 'Could not load track details.'}</p><Button variant="outline" onClick={() => retry()}>{language === 'pl' ? 'Spróbuj ponownie' : 'Try again'}</Button><Button variant="ghost" onClick={onBack}>{t('back')}</Button></div>
    return (
        <div className={inline ? "space-y-3" : "space-y-4"}>
            {!inline && <TrackHeader
                trackName={track.trackName}
                artistName={track.artistName}
                albumName={track.albumName}
                onBack={onBack}
            />}
            <TrackStats
                totalPlays={track.totalPlays}
                totalMinutes={track.totalMinutes}
                avgPlayDuration={track.avgPlayDuration}
                skipPercentage={track.skipPercentage}
            />
            <Card>
                <CardContent className={inline ? "p-3" : "pt-6"}>
                 {timelineError ? <Button variant="outline" onClick={() => retryTimeline()}>{language === 'pl' ? 'Ponów pobieranie historii' : 'Retry listening history'}</Button> : <TrackTimeline
                    isLoading={timelineLoading}
                    data={timelineData}
                    trackName={track.trackName}
                    totalPlays={track.totalPlays}
                />}
                </CardContent>
            </Card>
            <details open={inline ? undefined : true}><summary className="cursor-pointer py-2 text-sm font-medium text-primary">{language === 'pl' ? 'Pokaż historię odtworzeń' : 'Show playback history'}</summary>
            {playsError ? <Button variant="outline" onClick={() => retryPlays()}>{language === 'pl' ? 'Ponów pobieranie odtworzeń' : 'Retry plays'}</Button> : <TrackRecentPlays
                plays={plays}
                loading={playsLoading}
                pagination={playsPagination}
                onPageChange={fetchTrackPlays}
            />}
            </details>
        </div>
    )
}
