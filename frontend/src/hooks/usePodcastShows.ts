import { useState } from 'react'
import { useApiQuery } from '../lib/api'
export type SortKey = 'name' | 'plays' | 'time' | 'lastPlayed'
export type SortOrder = 'asc' | 'desc'

const DEFAULT_ORDER: Record<SortKey, SortOrder> = {
  plays: 'desc',
  time: 'desc',
  lastPlayed: 'desc',
  name: 'desc'
}

interface ShowRow {
  id: number
  name: string
  playCount: number
  totalTime: number
  lastPlayed?: string | null
}

export const usePodcastShows = (selectedProfile: string | null) => {
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<SortKey>('plays')
    const [order, setOrder] = useState<SortOrder>('desc')
    const [limit, setLimit] = useState(50)
    const [offset, setOffset] = useState(0)
    const params = new URLSearchParams({ profileId: selectedProfile || 'all', search, sortBy, order, limit: String(limit), offset: String(offset) })
    const query = useApiQuery<{ shows: ShowRow[]; total: number }>(`/api/podcasts/shows?${params}`)
    const total = query.data?.data.total || 0
    return {
        shows: query.data?.data.shows || [], loading: query.isPending, error: query.error,
        search, setSearch: (value: string) => { setSearch(value); setOffset(0) }, sortBy, order, limit,
        setLimit: (value: number) => { setLimit(value); setOffset(0) }, offset, total,
        totalPages: Math.max(1, Math.ceil(total / limit)), currentPage: Math.floor(offset / limit) + 1,
        canPrev: offset > 0, canNext: offset + limit < total,
        handleSortChange: (value: SortKey) => { setSortBy(value); setOrder(DEFAULT_ORDER[value]); setOffset(0) },
        handleOrderToggle: () => setOrder(value => value === 'asc' ? 'desc' : 'asc'),
        handlePageChange: setOffset, handleSearch: () => setOffset(0), fetchShows: query.refetch,
    }
}
