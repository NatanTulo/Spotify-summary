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
}

export function TrackDetails({ trackId, profileId, onBack }: TrackDetailsProps) {
    const { t } = useLanguage()
    const { 
        track, 
        plays, 
        timelineData, 
        loading, 
        timelineLoading, 
        playsLoading, 
        playsPagination, 
        fetchTrackPlays 
    } = useTrackDetails(trackId, profileId)

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
            <TrackHeader 
                trackName={track.trackName}
                artistName={track.artistName}
                albumName={track.albumName}
                onBack={onBack}
            />

            <TrackStats 
                totalPlays={track.totalPlays}
                totalMinutes={track.totalMinutes}
                avgPlayDuration={track.avgPlayDuration}
                skipPercentage={track.skipPercentage}
            />

            <Card>
                <CardContent className="pt-6">
                 <TrackTimeline
                    isLoading={timelineLoading}
                    data={timelineData}
                    trackName={track.trackName}
                    totalPlays={track.totalPlays}
                />
                </CardContent>
            </Card>

            <TrackRecentPlays 
                plays={plays}
                loading={playsLoading}
                pagination={playsPagination}
                onPageChange={fetchTrackPlays}
            />
        </div>
    )
}
