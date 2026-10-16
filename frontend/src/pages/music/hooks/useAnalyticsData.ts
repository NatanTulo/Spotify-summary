import { useCallback } from 'react'
import { useApiQuery, queryClient } from '../../../lib/api'
import type { TopArtist, TimeOfDayStat, DayOfWeekStat } from '../types'
interface Year { year: number; plays: number; totalMinutes: number }
interface Country { country: string; plays: number; totalMinutes: number }
interface Timeline { period: string; plays: number; totalMinutes: number }
export const useAnalyticsData = (profileId: string | null) => {
    const suffix = `profileId=${profileId || 'all'}`
    const yearly = useApiQuery<Year[]>(`/api/stats/yearly?${suffix}`)
    const countries = useApiQuery<Country[]>(`/api/stats/countries?${suffix}`)
    const artists = useApiQuery<TopArtist[]>(`/api/artists/top?limit=10&${suffix}`)
    const timeline = useApiQuery<Timeline[]>(`/api/stats/timeline?period=day&${suffix}`)
    const hours = useApiQuery<TimeOfDayStat[]>(`/api/stats/time-of-day?${suffix}`)
    const days = useApiQuery<DayOfWeekStat[]>(`/api/stats/day-of-week?${suffix}`)
    const fetchStats = useCallback(() => queryClient.invalidateQueries({ queryKey: ['api'] }), [])
    return {
        yearlyStats: (yearly.data?.data || []).map(row => ({ ...row, minutes: row.totalMinutes })),
        countryStats: countries.data?.data || [], topArtists: artists.data?.data || [],
        timelineData: (timeline.data?.data || []).map(row => ({ date: row.period, plays: Number(row.plays), minutes: Number(row.totalMinutes) })),
        timeOfDayStats: hours.data?.data || [], dayOfWeekStats: days.data?.data || [],
        statsLoading: [yearly, countries, artists, timeline, hours, days].some(query => query.isPending), fetchStats,
    }
}
