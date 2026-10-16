import { useState, useCallback, type SetStateAction } from 'react'
import { useApiQuery } from '../../../lib/api'
import type { FilterState } from '../types'
export interface Album { id: number; name: string; artist: string; plays: number; minutes: number }
export const useAlbumsData = (profileId: string | null) => {
    const [filters, updateFilters] = useState<FilterState>({
        search: '',
        minPlays: 0,
        dateFrom: '',
        dateTo: '',
        country: '',
        platform: '',
        sortBy: 'plays',
        sortOrder: 'desc',
        showSkipped: false,
        showShuffle: false
    })


    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)
    const setFilters = useCallback((value: SetStateAction<FilterState>) => { setPage(1); updateFilters(value) }, [])
    const params = new URLSearchParams({ page: String(page), limit: String(limit), profileId: profileId || 'all' })
    for (const [key, value] of Object.entries(filters)) if (value !== '') params.set(key, String(value))
    const query = useApiQuery<Album[]>(`/api/albums?${params}`)
    const fetchAlbums = useCallback(async (nextPage = 1, nextLimit?: number) => { setPage(nextPage); if (nextLimit) setLimit(nextLimit) }, [])
    const handleSort = (field: string, order: 'asc' | 'desc') => { setPage(1); setFilters(previous => ({ ...previous, sortBy: field, sortOrder: order })) }
    return {
        albums: query.data?.data || [], loading: query.isPending, error: query.error,
        pagination: query.data?.pagination || { page, limit, total: 0, pages: 0 },
        filters, setFilters, fetchAlbums, handleSort,
        handlePageChange: setPage,
        handlePageSizeChange: (size: number) => { setLimit(size); setPage(1) },
    }
}
