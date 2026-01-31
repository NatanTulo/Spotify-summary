import React from 'react'
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
    const { t } = useLanguage()
    
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
    } = usePodcastsData(selectedProfile)

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
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{t('podcastsTitle') || 'Podcasts'}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    {t('podcastsDescription') || 'Explore your podcast listening history and statistics'}
                </p>
            </div>

            {/* Overview Stats */}
            {overviewStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                    <TabsTrigger value="shows" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t('showsAndEpisodes') || 'Shows & Episodes'}</span>
                        <span className="sm:hidden">{t('shows') || 'Shows'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">
                        <span className="hidden sm:inline">{t('overview') || 'Overview'}</span>
                        <span className="sm:hidden">{t('overviewShort') || 'Overview'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="text-xs sm:text-sm hidden sm:flex">
                        <span className="hidden sm:inline">{t('charts') || 'Charts'}</span>
                        <span className="sm:hidden">{t('chartsShort') || 'Charts'}</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs sm:text-sm hidden sm:flex">
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
