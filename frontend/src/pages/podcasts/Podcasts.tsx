import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import PodcastsShowsList from '../../components/podcasts/PodcastsShowsList'
import { usePodcastsData } from './hooks/usePodcastsData'
import { PodcastsOverviewTab } from './tabs/PodcastsOverviewTab'
import { PodcastsChartsTab } from './tabs/PodcastsChartsTab'
import { PodcastsInsightsTab } from './tabs/PodcastsInsightsTab'

const Podcasts: React.FC = () => {
    const { selectedProfile } = useProfile()
    const { t, language } = useLanguage()
    const pl = language === 'pl'

    const {
        loading,
        error,
        overviewStats,
        topShows,
        topEpisodes,
        dailyStats,
        timelineStats,
        timeOfDayStats,
        dayOfWeekStats,
        refreshData,
    } = usePodcastsData(selectedProfile)

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('podcastsTitle') || 'Podcasts'}</h1>

                    <p role="status" className="mt-4 text-muted-foreground">{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">{t('podcastsTitle') || 'Podcasts'}</h1>
                    <div role="alert" className="border border-destructive/40 bg-card px-4 py-3 rounded-lg">
                        <p>{pl ? 'Nie udało się pobrać podcastów.' : 'Podcasts could not be loaded.'}</p>
                        <Button className="mt-3" variant="outline" onClick={() => void refreshData()}>{pl ? 'Spróbuj ponownie' : 'Try again'}</Button>
                    </div>
                </div>
            </div>
        )
    }

    if (overviewStats?.totalPodcastPlays === 0) return <section className="space-y-4"><h1 className="text-3xl font-bold tracking-tight">{t('podcastsTitle')}</h1><div className="rounded-xl border bg-card p-6"><h2 className="text-lg font-semibold">{pl ? 'Brak podcastów w tym okresie' : 'No podcasts in this period'}</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">{pl ? 'Wybierz inny zakres dat lub sprawdź, czy import zawiera historię podcastów.' : 'Choose another date range or check whether your import includes podcast history.'}</p><Link to="/data" className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-primary hover:underline">{pl ? 'Dane i import' : 'Data and import'}</Link></div></section>

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{t('podcastsTitle') || 'Podcasts'}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    {t('podcastsDescription') || 'Explore your podcast listening history and statistics'}
                </p>
            </div>

            {/* Overview Stats */}
            {overviewStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl font-semibold tabular-nums">
                                {overviewStats.totalPodcastPlays.toLocaleString()}
                            </CardTitle>
                            <CardDescription>
                                {t('totalPlays') || 'Total Plays'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl font-semibold tabular-nums">
                                {overviewStats.totalPodcastMinutes.toLocaleString()}
                            </CardTitle>
                            <CardDescription>
                                {t('totalMinutes') || 'Total Minutes'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl font-semibold tabular-nums">
                                {overviewStats.uniqueShows}
                            </CardTitle>
                            <CardDescription>
                                {t('uniqueShows') || 'Unique Shows'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-3xl font-semibold tabular-nums">
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
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
                    <TabsTrigger value="shows" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t('showsAndEpisodes') || 'Shows & Episodes'}</span>
                        <span className="sm:hidden">{t('shows') || 'Shows'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t('overview') || 'Overview'}</span>
                        <span className="sm:hidden">{t('overviewShort') || 'Overview'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t('charts') || 'Charts'}</span>
                        <span className="sm:hidden">{t('chartsShort') || 'Charts'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t('insights') || 'Insights'}</span>
                        <span className="sm:hidden">{t('insightsShort') || 'Insights'}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <PodcastsOverviewTab topShows={topShows} topEpisodes={topEpisodes} />
                </TabsContent>

                <TabsContent value="shows" className="space-y-4">
                    <PodcastsShowsList />
                </TabsContent>

                <TabsContent value="charts" className="space-y-4">
                    <PodcastsChartsTab
                        timelineStats={timelineStats}
                        dailyStats={dailyStats}
                        timeOfDayStats={timeOfDayStats}
                        dayOfWeekStats={dayOfWeekStats}
                    />
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <PodcastsInsightsTab dailyStats={dailyStats} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default Podcasts
