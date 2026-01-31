import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/context/LanguageContext'
import { TopShow, TopEpisode } from '../types'

interface PodcastsOverviewTabProps {
    topShows: TopShow[]
    topEpisodes: TopEpisode[]
}

export function PodcastsOverviewTab({ topShows, topEpisodes }: PodcastsOverviewTabProps) {
    const { t } = useLanguage()

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
    )
}
