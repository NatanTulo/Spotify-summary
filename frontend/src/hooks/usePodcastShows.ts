import { useState, useEffect, useMemo } from 'react'
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

interface ApiResponse<T> { success: boolean; data: T }

export const usePodcastShows = (selectedProfile: string | null) => {
  const [shows, setShows] = useState<ShowRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('plays')
  const [order, setOrder] = useState<SortOrder>('desc')
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchShows()
  }, [selectedProfile, sortBy, order, offset])

  const fetchShows = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        sortBy,
        order,
        profileId: selectedProfile || 'all',
      })
      if (search) params.append('search', search)
      const res = await fetch(`/api/podcasts/shows?${params.toString()}`)
      const json: ApiResponse<{ shows: ShowRow[]; total: number; limit: number; offset: number }> = await res.json()
      if (json.success) {
        setShows(json.data.shows)
        setTotal(json.data.total || 0)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (val: SortKey) => {
    setSortBy(val)
    setOrder(DEFAULT_ORDER[val])
    setOffset(0)
  }

  const handleOrderToggle = () => {
    setOrder(o => (o === 'asc' ? 'desc' : 'asc'))
  }

  const handlePageChange = (newOffset: number) => {
     setOffset(newOffset)
  }

  const handleSearch = () => {
      setOffset(0)
      fetchShows()
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return shows
    const q = search.toLowerCase()
    return shows.filter(s => s.name.toLowerCase().includes(q))
  }, [shows, search])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.floor(offset / limit) + 1
  const canPrev = offset > 0
  const canNext = offset + limit < total

  return {
      shows: filtered,
      loading,
      search,
      setSearch,
      sortBy,
      order,
      limit,
      setLimit,
      offset,
      total,
      totalPages,
      currentPage,
      canPrev,
      canNext,
      handleSortChange,
      handleOrderToggle,
      handlePageChange,
      handleSearch,
      fetchShows
  }
}
