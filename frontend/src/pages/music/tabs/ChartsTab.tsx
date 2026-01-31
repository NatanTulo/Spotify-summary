import { Suspense, lazy } from 'react'
import { TimeOfDayChart } from '@/components/charts/TimeOfDayChart'
import { DayOfWeekChart } from '@/components/charts/DayOfWeekChart'
import { TimeOfDayStat, DayOfWeekStat, TimelineStat } from '../types'

const PlaysByCountryChart = lazy(() => import('@/components/charts/PlaysByCountryChart').then(module => ({ default: module.PlaysByCountryChart })))
const YearlyStatsChart = lazy(() => import('@/components/charts/YearlyStatsChart').then(module => ({ default: module.YearlyStatsChart })))
const ListeningTimelineChart = lazy(() => import('@/components/charts/ListeningTimelineChart').then(module => ({ default: module.ListeningTimelineChart })))

interface ChartsTabProps {
    yearlyStats: any[]
    countryStats: any[]
    timeOfDayStats: TimeOfDayStat[]
    dayOfWeekStats: DayOfWeekStat[]
    timelineData: TimelineStat[]
    loading: boolean
}

const ChartLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
)

export function ChartsTab({
    yearlyStats,
    countryStats,
    timeOfDayStats,
    dayOfWeekStats,
    timelineData,
    loading
}: ChartsTabProps) {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <Suspense fallback={<ChartLoader />}>
                    <YearlyStatsChart data={yearlyStats} />
                </Suspense>
                <Suspense fallback={<ChartLoader />}>
                    <PlaysByCountryChart data={countryStats} loading={loading} />
                </Suspense>
            </div>
            
            <TimeOfDayChart data={timeOfDayStats} />
            <DayOfWeekChart data={dayOfWeekStats} />
            
            <Suspense fallback={<ChartLoader />}>
                <ListeningTimelineChart data={timelineData} />
            </Suspense>
        </div>
    )
}
