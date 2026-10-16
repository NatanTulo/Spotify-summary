import { useApiQuery, queryClient } from '../../../lib/api'
import type { PodcastStats, TopShow, TopEpisode, DailyStats, TimeOfDayStat, DayOfWeekStat } from '../types'
export const usePodcastsData = (profileId: string | null) => {
    const suffix = `profileId=${profileId || 'all'}`
    const overview = useApiQuery<PodcastStats>(`/api/podcasts/stats?${suffix}`)
    const shows = useApiQuery<TopShow[]>(`/api/podcasts/top-shows?limit=10&${suffix}`)
    const episodes = useApiQuery<TopEpisode[]>(`/api/podcasts/top-episodes?limit=20&${suffix}`)
    const timeline = useApiQuery<DailyStats[]>(`/api/podcasts/daily-stats-all?${suffix}`)
    const hours = useApiQuery<TimeOfDayStat[]>(`/api/podcasts/time-of-day?${suffix}`)
    const days = useApiQuery<DayOfWeekStat[]>(`/api/podcasts/day-of-week?${suffix}`)
    const queries = [overview, shows, episodes, timeline, hours, days]
    return {
        loading: queries.some(query => query.isPending), error: queries.find(query => query.error)?.error?.message || null,
        overviewStats: overview.data?.data || null, topShows: shows.data?.data || [], topEpisodes: episodes.data?.data || [],
        dailyStats: timeline.data?.data || [], timelineStats: timeline.data?.data || [],
        timeOfDayStats: hours.data?.data || [], dayOfWeekStats: days.data?.data || [],
        refreshData: () => queryClient.invalidateQueries({ queryKey: ['api'] }),
    }
}
