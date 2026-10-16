import { useState, useCallback, type SetStateAction } from 'react'
import { useApiQuery } from '../../../lib/api'
import type { FilterState, Track } from '../types'
export const useTracksData = (profileId: string | null) => {
    const [filters, updateFilters] = useState<FilterState>({
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


    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const setFilters = useCallback((value: SetStateAction<FilterState>) => { setPage(1); updateFilters(value) }, [])
    const params = new URLSearchParams({ page: String(page), limit: String(limit), profileId: profileId || 'all' })
    for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, String(value))
    const query = useApiQuery<Track[]>(`/api/tracks?${params}`)
    const fetchTracks = useCallback(async (nextPage = 1, nextLimit?: number) => { setPage(nextPage); if (nextLimit) setLimit(nextLimit) }, [])
    const handleSort = (field: string, order: 'asc' | 'desc') => { setPage(1); setFilters(previous => ({ ...previous, sortBy: field, sortOrder: order })) }
    return {
        tracks: query.data?.data || [], loading: query.isPending, error: query.error,
        pagination: query.data?.pagination || { page, limit, total: 0, pages: 0 },
        filters, setFilters, fetchTracks, handleSort,
        handlePageChange: setPage,
        handlePageSizeChange: (size: number) => { setLimit(size); setPage(1) },
    }
}
