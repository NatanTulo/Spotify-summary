import { useState, useCallback } from 'react'
import { FilterState, Track } from '../types'

export const useTracksData = (profileId: string | null) => {
    const [tracks, setTracks] = useState<Track[]>([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    })
    const [filters, setFilters] = useState<FilterState>({
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

    const fetchTracks = useCallback(async (page = 1, limit?: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: (limit || pagination.limit).toString(),
                search: filters.search,
                minPlays: filters.minPlays.toString(),
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                ...(filters.country && { country: filters.country }),
                ...(filters.platform && { platform: filters.platform }),
                ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
                ...(filters.dateTo && { dateTo: filters.dateTo }),
                ...(profileId && { profileId: profileId })
            })

            const response = await fetch(`/api/tracks?${params}&_t=${Date.now()}`)
            if (response.ok) {
                const data = await response.json()
                setTracks(data.data || [])
                setPagination(data.pagination || pagination)
            }
        } catch (error) {
            console.error('Failed to fetch tracks:', error)
        } finally {
            setLoading(false)
        }
    }, [filters, pagination.limit, profileId])

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }))
        fetchTracks(page)
    }

    const handlePageSizeChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
        fetchTracks(1, newLimit)
    }

    const handleSort = (field: string, order: 'asc' | 'desc') => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: order
        }))
    }

    return {
        tracks,
        loading,
        pagination,
        filters,
        setFilters,
        fetchTracks,
        handlePageChange,
        handlePageSizeChange,
        handleSort
    }
}
