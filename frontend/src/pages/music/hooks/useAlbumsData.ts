import { useState, useCallback } from 'react'
import { FilterState } from '../types'

export interface Album {
    id: number
    name: string
    artist: string
    plays: number
    minutes: number
}

export const useAlbumsData = (profileId: string | null) => {
    const [albums, setAlbums] = useState<Album[]>([])
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
        sortBy: 'plays',
        sortOrder: 'desc',
        showSkipped: false,
        showShuffle: false
    })

    const fetchAlbums = useCallback(async (page = 1, limit?: number) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: (limit || pagination.limit).toString(),
                search: filters.search,
                sortBy: filters.sortBy,
                sortOrder: filters.sortOrder,
                ...(profileId && { profileId: profileId })
            })

            const response = await fetch(`/api/albums?${params}&_t=${Date.now()}`)
            if (response.ok) {
                const data = await response.json()
                setAlbums(data.data || [])
                setPagination(data.pagination || pagination)
            }
        } catch (error) {
            console.error('Failed to fetch albums:', error)
        } finally {
            setLoading(false)
        }
    }, [filters, pagination.limit, profileId])

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, page }))
        fetchAlbums(page)
    }

    const handlePageSizeChange = (newLimit: number) => {
        setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }))
        fetchAlbums(1, newLimit)
    }

    const handleSort = (field: string, order: 'asc' | 'desc') => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: order
        }))
    }

    return {
        albums,
        loading,
        pagination,
        filters,
        setFilters,
        fetchAlbums,
        handlePageChange,
        handlePageSizeChange,
        handleSort
    }
}
