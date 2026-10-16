import { useApiQuery } from '../../../lib/api'
import type { Track } from '../types'
import { useLibraryState } from './useLibraryState'
export const useTracksData = (profileId: string | null) => {
    const { filters, queryFilters, setFilters, page, limit, setPage, setLimit } = useLibraryState('music')
    const params = new URLSearchParams({ page: String(page), limit: String(limit), profileId: profileId || 'all' })
    for (const [key, value] of Object.entries(queryFilters)) if (value !== '') params.set(key, String(value))
    const query = useApiQuery<Track[]>(`/api/tracks?${params}`)
    return {
        tracks: query.data?.data || [], loading: query.isPending, error: query.error,
        pagination: query.data?.pagination || { page, limit, total: 0, pages: 0 },
        filters, setFilters, fetchTracks: () => query.refetch(),
        handleSort: (field: string, order: 'asc' | 'desc') => setFilters(previous => ({ ...previous, sortBy: field, sortOrder: order })),
        handlePageChange: setPage, handlePageSizeChange: setLimit,
    }
}
