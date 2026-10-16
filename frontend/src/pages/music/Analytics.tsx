import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, PieChart, TrendingUp, Music, Percent, Disc } from 'lucide-react'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import { useAnalyticsData } from './hooks/useAnalyticsData'
import { useTracksData } from './hooks/useTracksData'
import { useFilterMetadata } from '../../hooks/useFilterMetadata'
import { OverviewTab } from './tabs/OverviewTab'
import { ChartsTab } from './tabs/ChartsTab'
import { TracksTab } from './tabs/TracksTab'
import { AlbumsTab } from './tabs/AlbumsTab'
import { InsightsTab } from './tabs/InsightsTab'

export default function Analytics() {
    const { selectedProfile } = useProfile()
    const { t, language } = useLanguage()
    const [params, setParams] = useSearchParams()
    const tab = ['tracks','albums','overview','charts','insights'].includes(params.get('tab') || '') ? params.get('tab')! : 'tracks'

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
        error: tracksError,
        pagination,
        filters,
        setFilters,
        fetchTracks,
        handlePageChange,
        handlePageSizeChange,
        handleSort
    } = useTracksData(selectedProfile)

    const { metadata } = useFilterMetadata(selectedProfile)
    const availableCountries = metadata.countries
    const availablePlatforms = metadata.platforms

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{language === 'pl' ? 'Muzyka' : 'Music'}</h1>
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
            <Tabs value={tab} onValueChange={value => setParams(current => { const next = new URLSearchParams(current); next.set('tab', value); return next })} className="space-y-3">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
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
                    <TabsTrigger value="insights" className="flex items-center justify-center space-x-1 sm:space-x-2">
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
                        error={tracksError}
                        pagination={pagination}
                        filters={filters}
                        selectedProfile={selectedProfile}
                        availableCountries={availableCountries}
                        availablePlatforms={availablePlatforms}
                        onFiltersChange={setFilters}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onSort={handleSort}
                        onApplyFilters={() => fetchTracks()}
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
