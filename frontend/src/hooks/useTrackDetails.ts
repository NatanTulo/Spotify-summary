import { useState, useEffect } from 'react'
import { useApiQuery } from '../lib/api'
export interface DetailedTrack {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    uri?: string
    duration?: number
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
    platforms?: string[]
    countries?: string[]
    firstPlay?: Date
    lastPlay?: Date
    username?: string
    reasonStart?: string[]
    reasonEnd?: string[]
    shuffle?: boolean | null
    offline?: boolean | null
    incognitoMode?: boolean | null
}

export interface Play {
    id: string
    playedAt: Date | string
    msPlayed: number
    durationMinutes: number
    platform?: string
    country?: string
    username?: string
    reasonStart?: string
    reasonEnd?: string
    shuffle?: boolean
    offline?: boolean
    incognitoMode?: boolean
    skipped?: boolean
}


function mapTrack(rawTrack: any): DetailedTrack {
    return {
                    trackId: rawTrack.id.toString(),
                    trackName: rawTrack.name,
                    artistName: rawTrack.album?.artist?.name || '',
                    albumName: rawTrack.album?.name || '',
                    uri: rawTrack.uri,
                    duration: rawTrack.duration,
                    totalPlays: rawTrack.stats?.totalPlays || 0,
                    totalMinutes: rawTrack.stats?.totalMinutes || 0,
                    avgPlayDuration: rawTrack.stats?.avgPlayDuration || 0,
                    skipPercentage: rawTrack.stats?.skipPercentage || 0,
                    // Extract platforms and countries from recent plays
                    platforms: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.platform).filter(Boolean))] as string[] : [],
                    countries: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.country).filter(Boolean))] as string[] : [],
                    // Get first and last play dates from stats (aggregated data)
                    firstPlay: rawTrack.stats?.firstPlay ? new Date(rawTrack.stats.firstPlay) : undefined,
                    lastPlay: rawTrack.stats?.lastPlay ? new Date(rawTrack.stats.lastPlay) : undefined,
                    // Extract other fields from recent plays (take most common values)
                    username: rawTrack.recentPlays?.[0]?.profile?.name,
                    reasonStart: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.reasonStart).filter(Boolean))] as string[] : [],
                    reasonEnd: rawTrack.recentPlays ? 
                        [...new Set(rawTrack.recentPlays.map((play: any) => play.reasonEnd).filter(Boolean))] as string[] : [],
                    shuffle: rawTrack.recentPlays?.[0]?.shuffle,
                    offline: rawTrack.recentPlays?.[0]?.offline,
                    incognitoMode: rawTrack.recentPlays?.[0]?.incognitoMode,
                }
}
export const useTrackDetails = (trackId: string, profileId?: string) => {
    const [page, setPage] = useState(1)
    useEffect(() => setPage(1), [trackId, profileId])
    const params = new URLSearchParams()
    if (profileId) params.set('profileId', profileId)
    const base = `/api/tracks/${encodeURIComponent(trackId)}`
    const details = useApiQuery<any>(`${base}?${params}`, !!trackId)
    const timeline = useApiQuery<any[]>(`${base}/timeline?${params}`, !!trackId)
    params.set('page', String(page)); params.set('limit', '50')
    const plays = useApiQuery<Play[]>(`${base}/plays?${params}`, !!trackId)
    return {
        track: details.data?.data ? mapTrack(details.data.data) : null,
        plays: plays.data?.data || [], timelineData: timeline.data?.data || [],
        loading: details.isPending, error: details.error, retry: () => details.refetch(),
        timelineLoading: timeline.isPending, timelineError: timeline.error, retryTimeline: () => timeline.refetch(),
        playsLoading: plays.isPending, playsError: plays.error, retryPlays: () => plays.refetch(),
        playsPagination: plays.data?.pagination || { page, limit: 50, total: 0, pages: 0 },
        fetchTrackPlays: setPage,
    }
}
