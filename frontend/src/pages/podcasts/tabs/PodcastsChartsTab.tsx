import { ListeningTimelineChart } from '@/components/charts/ListeningTimelineChart'
import { TimeOfDayChart } from '@/components/charts/TimeOfDayChart'
import { DayOfWeekChart } from '@/components/charts/DayOfWeekChart'
import { DailyStats, TimeOfDayStat, DayOfWeekStat } from '../types'

interface PodcastsChartsTabProps {
    timelineStats: DailyStats[]
    dailyStats: DailyStats[]
    timeOfDayStats: TimeOfDayStat[]
    dayOfWeekStats: DayOfWeekStat[]
}

export function PodcastsChartsTab({
    timelineStats,
    dailyStats,
    timeOfDayStats,
    dayOfWeekStats
}: PodcastsChartsTabProps) {
    // Map data to match the expected interface of TimeOfDayChart and DayOfWeekChart (totalMinutes instead of minutes)
    const mappedTimeOfDayStats = timeOfDayStats.map(stat => ({
        ...stat,
        totalMinutes: stat.minutes
    }));

    const mappedDayOfWeekStats = dayOfWeekStats.map(stat => ({
        ...stat,
        totalMinutes: stat.minutes
    }));

    return (
        <div className="space-y-4">
            {/* Timeline (daily activity) */}
            <ListeningTimelineChart data={(timelineStats.length ? timelineStats : dailyStats).map(d => ({
                date: d.date,
                plays: d.plays,
                minutes: d.minutes 
            }))} />
            
            {/* Time of Day */}
            <TimeOfDayChart data={mappedTimeOfDayStats} />

            {/* Day of Week */}
            <DayOfWeekChart data={mappedDayOfWeekStats} />
        </div>
    )
}
