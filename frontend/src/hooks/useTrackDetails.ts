import { useState, useEffect } from 'react'

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

// Timeline cache to prevent repeated requests
const timelineCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useTrackDetails = (trackId: string, profileId?: string) => {
    const [track, setTrack] = useState<DetailedTrack | null>(null)
    const [plays, setPlays] = useState<Play[]>([])
    const [timelineData, setTimelineData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [timelineLoading, setTimelineLoading] = useState(true)
    const [playsLoading, setPlaysLoading] = useState(false)
    const [playsPagination, setPlaysPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
    })

    useEffect(() => {
        if (!trackId) return
        
        const fetchData = async () => {
            setLoading(true)
            await Promise.all([
                fetchTrackDetails(),
                fetchTrackPlays(1),
                fetchTrackTimeline()
            ])
            setLoading(false)
        }
        
        fetchData()
    }, [trackId, profileId])

    const fetchTrackDetails = async () => {
        try {
            const response = await fetch(`/api/tracks/${trackId}`)
            if (response.ok) {
                const data = await response.json()
                const rawTrack = data.data
                
                // Map API response to expected format
                const mappedTrack: DetailedTrack = {
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
                
                setTrack(mappedTrack)
            }
        } catch (error) {
            console.error('Error fetching track details:', error)
        }
    }

    const fetchTrackTimeline = async () => {
        try {
            setTimelineLoading(true)
            
            // Check cache first
            const cacheKey = `${trackId}-${profileId || 'all'}`
            const cached = timelineCache.get(cacheKey)
            
            if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                setTimelineData(cached.data)
                setTimelineLoading(false)
                return
            }

            const params = new URLSearchParams()
            if (profileId) {
                params.append('profileId', profileId)
            }

            // Add timeout for request
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

            const response = await fetch(`/api/tracks/${trackId}/timeline?${params}`, {
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)

            if (response.ok) {
                const data = await response.json()
                const timelineData = data.data || []
                setTimelineData(timelineData)
                
                // Cache the result
                timelineCache.set(cacheKey, {
                    data: timelineData,
                    timestamp: Date.now()
                })
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('Timeline request was aborted due to timeout')
            } else {
                console.error('Error fetching track timeline:', error)
            }
        } finally {
            setTimelineLoading(false)
        }
    }

    const fetchTrackPlays = async (page = 1) => {
        try {
            setPlaysLoading(true)
            const params = new URLSearchParams()
            if (profileId) {
                params.append('profileId', profileId)
            }
            params.append('page', page.toString())
            params.append('limit', '50')

            const response = await fetch(`/api/tracks/${trackId}/plays?${params}`)
            if (response.ok) {
                const data = await response.json()
                setPlays(data.data || [])
                setPlaysPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 0 })
            }
        } catch (error) {
            console.error('Error fetching track plays:', error)
        } finally {
            setPlaysLoading(false)
        }
    }

    return {
        track,
        plays,
        timelineData,
        loading,
        timelineLoading,
        playsLoading,
        playsPagination,
        fetchTrackPlays
    }
}
