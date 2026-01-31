import { useState, useEffect, useCallback } from 'react'
import {
    PodcastStats,
    TopShow,
    TopEpisode,
    DailyStats,
    TimeOfDayStat,
    DayOfWeekStat,
    ApiResponse
} from '../types'

export const usePodcastsData = (profileId: string | null) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // Data states
    const [overviewStats, setOverviewStats] = useState<PodcastStats | null>(null)
    const [topShows, setTopShows] = useState<TopShow[]>([])
    const [topEpisodes, setTopEpisodes] = useState<TopEpisode[]>([])
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
    const [timelineStats, setTimelineStats] = useState<DailyStats[]>([])
    const [timeOfDayStats, setTimeOfDayStats] = useState<TimeOfDayStat[]>([])
    const [dayOfWeekStats, setDayOfWeekStats] = useState<DayOfWeekStat[]>([])

    const fetchOverviewStats = async () => {
        try {
            const params = new URLSearchParams()
            params.append('profileId', profileId || 'all')
            const response = await fetch(`/api/podcasts/stats?${params}`)
            const result: ApiResponse<PodcastStats> = await response.json()
            
            if (result.success) {
                setOverviewStats(result.data)
            }
        } catch (error) {
            console.error('Error fetching overview stats:', error)
        }
    }

    const fetchTopShows = async () => {
        try {
            const params = new URLSearchParams({ 
                limit: '10',
                profileId: profileId || 'all'
            })
            const response = await fetch(`/api/podcasts/top-shows?${params}`)
            const result: ApiResponse<TopShow[]> = await response.json()
            
            if (result.success) {
                setTopShows(result.data)
            }
        } catch (error) {
            console.error('Error fetching top shows:', error)
        }
    }

    const fetchTopEpisodes = async () => {
        try {
            const params = new URLSearchParams({ 
                limit: '20',
                profileId: profileId || 'all'
            })
            const response = await fetch(`/api/podcasts/top-episodes?${params}`)
            const result: ApiResponse<TopEpisode[]> = await response.json()
            
            if (result.success) {
                setTopEpisodes(result.data)
            }
        } catch (error) {
            console.error('Error fetching top episodes:', error)
        }
    }

    const fetchDailyStats = async () => {
        const windows = [30, 180, 365]
        for (const days of windows) {
            try {
                const params = new URLSearchParams({ 
                    days: days.toString(),
                    profileId: profileId || 'all'
                })
                const response = await fetch(`/api/podcasts/daily-stats?${params}`)
                const result: ApiResponse<DailyStats[]> = await response.json()
                if (result.success) {
                    const sumPlays = (result.data || []).reduce((a, d) => a + (d.plays || 0), 0)
                    if (sumPlays > 0 || days === windows[windows.length - 1]) {
                        setDailyStats(result.data)
                        break
                    }
                }
            } catch (err) {
                console.error(`Error fetching daily stats (${days}d):`, err)
                if (days === windows[windows.length - 1]) {
                    setDailyStats([])
                }
            }
        }
    }

    const fetchTimelineStats = async () => {
        try {
            const params = new URLSearchParams()
            params.append('profileId', profileId || 'all')
            const response = await fetch(`/api/podcasts/daily-stats-all?${params}`)
            const result: ApiResponse<DailyStats[]> = await response.json()
            if (result.success) {
                const sorted = [...(result.data || [])].sort((a,b) => a.date.localeCompare(b.date))
                setTimelineStats(sorted)
            }
        } catch (e) {
            console.error('Error fetching timeline stats:', e)
        }
    }

    const fetchTimeOfDay = async () => {
        try {
            const params = new URLSearchParams()
            params.append('profileId', profileId || 'all')
            const response = await fetch(`/api/podcasts/time-of-day?${params}`)
            const result: ApiResponse<TimeOfDayStat[]> = await response.json()
            if (result.success) setTimeOfDayStats(result.data)
        } catch (error) {
            console.error('Error fetching time-of-day:', error)
        }
    }

    const fetchDayOfWeek = async () => {
        try {
            const params = new URLSearchParams()
            params.append('profileId', profileId || 'all')
            const response = await fetch(`/api/podcasts/day-of-week?${params}`)
            const result: ApiResponse<DayOfWeekStat[]> = await response.json()
            if (result.success) setDayOfWeekStats(result.data)
        } catch (error) {
            console.error('Error fetching day-of-week:', error)
        }
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            await Promise.all([
                fetchOverviewStats(),
                fetchTopShows(),
                fetchTopEpisodes(),
                fetchDailyStats(),
                fetchTimelineStats(),
                fetchTimeOfDay(),
                fetchDayOfWeek()
            ])
        } catch (err) {
            console.error('Error fetching podcast data:', err)
            setError('Failed to load podcast data')
        } finally {
            setLoading(false)
        }
    }, [profileId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return {
        loading,
        error,
        overviewStats,
        topShows,
        topEpisodes,
        dailyStats,
        timelineStats,
        timeOfDayStats,
        dayOfWeekStats,
        refreshData: fetchData
    }
}
