import { useState, useCallback } from 'react'
import { TopArtist, TimeOfDayStat, DayOfWeekStat, TimelineStat } from '../types'

export const useAnalyticsData = (profileId: string | null) => {
    const [yearlyStats, setYearlyStats] = useState([])
    const [countryStats, setCountryStats] = useState([])
    const [timeOfDayStats, setTimeOfDayStats] = useState<TimeOfDayStat[]>([])
    const [dayOfWeekStats, setDayOfWeekStats] = useState<DayOfWeekStat[]>([])
    const [topArtists, setTopArtists] = useState<TopArtist[]>([])
    const [statsLoading, setStatsLoading] = useState(false)
    const [timelineData, setTimelineData] = useState<TimelineStat[]>([])

    const generateTimelineData = () => {
        const data = []
        const currentDate = new Date()
        for (let i = 30; i >= 0; i--) {
            const date = new Date(currentDate)
            date.setDate(currentDate.getDate() - i)
            data.push({
                date: date.toISOString().split('T')[0],
                plays: Math.floor(Math.random() * 100) + 20,
                minutes: Math.floor(Math.random() * 300) + 60
            })
        }
        return data
    }

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        try {
            const profileParam = profileId ? `?profileId=${profileId}` : ''

            const [yearlyRes, countryRes, artistsRes, timelineRes, timeOfDayRes, dayOfWeekRes] = await Promise.all([
                fetch(`/api/stats/yearly${profileParam}`),
                fetch(`/api/stats/countries${profileParam}`),
                fetch(`/api/artists/top?limit=10${profileId ? `&profileId=${profileId}` : ''}`),
                fetch(`/api/stats/timeline${profileParam}${profileParam ? '&' : '?'}period=day`),
                fetch(`/api/stats/time-of-day${profileParam}`),
                fetch(`/api/stats/day-of-week${profileParam}`)
            ])

            if (yearlyRes.ok) {
                const yearlyData = await yearlyRes.json()
                const mappedYearlyStats = (yearlyData.data || []).map((stat: any) => ({
                    ...stat,
                    minutes: stat.totalMinutes
                }))
                setYearlyStats(mappedYearlyStats)
            }

            if (countryRes.ok) {
                const countryData = await countryRes.json()
                setCountryStats(countryData.data || [])
            }

            if (artistsRes.ok) {
                const artistsData = await artistsRes.json()
                const mappedTopArtists: TopArtist[] = (artistsData.data || []).map((a: any) => ({
                    name: a.artistName || a.name || 'Unknown',
                    plays: Number(a.totalPlays ?? a.plays ?? 0),
                    minutes: Number(a.totalMinutes ?? a.minutes ?? 0)
                }))
                setTopArtists(mappedTopArtists)
            }

            if (timelineRes.ok) {
                const timelineData = await timelineRes.json()
                const mappedData = (timelineData.data || []).map((item: any) => ({
                    date: item.period,
                    plays: Number(item.plays) || 0,
                    minutes: Number(item.totalMinutes) || 0
                }))
                setTimelineData(mappedData)
            } else {
                setTimelineData(generateTimelineData())
            }

            if (timeOfDayRes.ok) {
                const todData = await timeOfDayRes.json()
                setTimeOfDayStats((todData.data || []).map((d: any) => ({
                    hour: d.hour,
                    plays: Number(d.plays) || 0,
                    totalMinutes: Number(d.totalMinutes) || 0
                })))
            }

            if (dayOfWeekRes.ok) {
                const dowData = await dayOfWeekRes.json()
                setDayOfWeekStats((dowData.data || []).map((d: any) => ({
                    dow: d.dow,
                    plays: Number(d.plays) || 0,
                    totalMinutes: Number(d.totalMinutes) || 0
                })))
            }

        } catch (error) {
            console.error('Failed to fetch stats:', error)
            setTimelineData(generateTimelineData())
        } finally {
            setStatsLoading(false)
        }
    }, [profileId])

    return {
        yearlyStats,
        countryStats,
        topArtists,
        timelineData,
        timeOfDayStats,
        dayOfWeekStats,
        statsLoading,
        fetchStats
    }
}
