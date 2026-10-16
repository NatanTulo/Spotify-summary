import { useApiQuery } from '../../../lib/api'
import { useLibraryState } from './useLibraryState'
export interface Album { id: number; name: string; artist: string; plays: number; minutes: number }
export const useAlbumsData = (profileId: string | null) => {
    const { filters, queryFilters, setFilters, page, limit, setPage, setLimit } = useLibraryState('albums', true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit), profileId: profileId || 'all' })
    for (const [key, value] of Object.entries(queryFilters)) if (value !== '') params.set(key, String(value))
    const query = useApiQuery<Album[]>(`/api/albums?${params}`)
    return {
        albums: query.data?.data || [], loading: query.isPending, error: query.error,
        pagination: query.data?.pagination || { page, limit, total: 0, pages: 0 },
        filters, setFilters, fetchAlbums: () => query.refetch(),
        handleSort: (field: string, order: 'asc' | 'desc') => setFilters(previous => ({ ...previous, sortBy: field, sortOrder: order })),
        handlePageChange: setPage, handlePageSizeChange: setLimit,
    }
}
