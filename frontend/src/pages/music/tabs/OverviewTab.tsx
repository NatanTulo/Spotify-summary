import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/context/LanguageContext'
import { TopArtist, Track } from '../types'

interface OverviewTabProps {
    topArtists: TopArtist[]
    topTracks: Track[]
}

export function OverviewTab({ topArtists, topTracks }: OverviewTabProps) {
    const { t } = useLanguage()

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                        {topTracks.slice(0, 5).map((track, index) => (
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
                        {topTracks.length === 0 && (
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
    )
}
