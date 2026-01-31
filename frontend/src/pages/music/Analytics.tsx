import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, PieChart, TrendingUp, Music, Percent, Disc } from 'lucide-react'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAnalyticsData } from './hooks/useAnalyticsData'
import { useTracksData } from './hooks/useTracksData'
import { OverviewTab } from './tabs/OverviewTab'
import { ChartsTab } from './tabs/ChartsTab'
import { TracksTab } from './tabs/TracksTab'
import { AlbumsTab } from './tabs/AlbumsTab'
import { InsightsTab } from './tabs/InsightsTab'

export default function Analytics() {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()

    const {
        yearlyStats,
        countryStats,
        topArtists,
        timelineData,
        timeOfDayStats,
        dayOfWeekStats,
        statsLoading,
        fetchStats
    } = useAnalyticsData(selectedProfile)

    const {
        tracks,
        loading: tracksLoading,
        pagination,
        filters,
        setFilters,
        fetchTracks,
        handlePageChange,
        handlePageSizeChange,
        handleSort
    } = useTracksData(selectedProfile)

    // availableCountries and availablePlatforms logic was missing in original file state management
    // Assuming they are static or fetched elsewhere, for now using empty arrays or props drilling could be improved
    const availableCountries: string[] = []
    const availablePlatforms: string[] = []

    useEffect(() => {
        fetchTracks()
        fetchStats()
    }, [selectedProfile, fetchTracks, fetchStats])

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('analyticsTitle')}</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                        {t('analyticsDescription')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            fetchTracks()
                            fetchStats()
                        }}
                        className="flex items-center space-x-2"
                    >
                        <TrendingUp className="h-4 w-4" />
                        <span>{t('refreshData')}</span>
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tracks" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    <TabsTrigger value="tracks" className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{t('tracksList')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="albums" className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Disc className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{t('albumsList')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{t('overview')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <PieChart className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{t('charts')}</span>
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="hidden sm:flex items-center justify-center space-x-1 sm:space-x-2">
                        <Percent className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">{t('insights')}</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <OverviewTab 
                        topArtists={topArtists} 
                        topTracks={tracks} 
                    />
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts">
                    <ChartsTab
                        yearlyStats={yearlyStats}
                        countryStats={countryStats}
                        timeOfDayStats={timeOfDayStats}
                        dayOfWeekStats={dayOfWeekStats}
                        timelineData={timelineData}
                        loading={statsLoading}
                    />
                </TabsContent>

                {/* Tracks Tab */}
                <TabsContent value="tracks">
                    <TracksTab
                        tracks={tracks}
                        loading={tracksLoading}
                        pagination={pagination}
                        filters={filters}
                        selectedProfile={selectedProfile}
                        availableCountries={availableCountries}
                        availablePlatforms={availablePlatforms}
                        onFiltersChange={setFilters}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onSort={handleSort}
                        onApplyFilters={() => fetchTracks(1)}
                        onResetFilters={() => {
                            setFilters({
                                search: '',
                                minPlays: 0,
                                dateFrom: '',
                                dateTo: '',
                                country: '',
                                platform: '',
                                sortBy: 'totalPlays',
                                sortOrder: 'desc',
                                showSkipped: false,
                                showShuffle: false
                            })
                            fetchTracks(1)
                        }}
                    />
                </TabsContent>

                {/* Albums Tab */}
                <TabsContent value="albums">
                    <AlbumsTab selectedProfile={selectedProfile} />
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights">
                    <InsightsTab 
                        timelineData={timelineData} 
                        topArtists={topArtists} 
                        yearlyStats={yearlyStats}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
