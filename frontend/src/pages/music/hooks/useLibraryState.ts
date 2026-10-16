import { useEffect, useState, type SetStateAction } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FilterState } from '../types'
export const defaultFilters = (album = false): FilterState => ({ search: '', minPlays: 0, dateFrom: '', dateTo: '', country: '', platform: '', sortBy: album ? 'plays' : 'totalPlays', sortOrder: 'desc', showSkipped: false, showShuffle: false })
export function useLibraryState(prefix: string, album = false) {
    const [params, setParams] = useSearchParams()
    const defaults = defaultFilters(album)
    const paramKey = (key: string) => prefix + key[0].toUpperCase() + key.slice(1)
    const filters = { ...defaults }
    for (const key of ['search', 'country', 'platform', 'sortBy'] as const) filters[key] = params.get(paramKey(key)) ?? defaults[key]
    filters.minPlays = Math.max(0, Number(params.get(paramKey('minPlays'))) || 0)
    filters.sortOrder = params.get(paramKey('sortOrder')) === 'asc' ? 'asc' : 'desc'
    filters.showSkipped = params.get(paramKey('showSkipped')) === 'true'
    filters.showShuffle = params.get(paramKey('showShuffle')) === 'true'
    const page = Math.max(1, Number(params.get(paramKey('page'))) || 1)
    const limit = [10, 20, 50, 100, 200, 500].includes(Number(params.get(paramKey('limit')))) ? Number(params.get(paramKey('limit'))) : 20
    const setFilters = (value: SetStateAction<FilterState>) => {
        const next = typeof value === 'function' ? value(filters) : value
        setParams(current => {
            const result = new URLSearchParams(current)
            for (const key of Object.keys(defaults) as (keyof FilterState)[]) {
                if (key === 'dateFrom' || key === 'dateTo') continue
                if (next[key] === defaults[key]) result.delete(paramKey(key))
                else result.set(paramKey(key), String(next[key]))
            }
            result.delete(paramKey('page'))
            return result
        }, { replace: true })
    }
    const setPage = (next: number) => setParams(current => { const result = new URLSearchParams(current); result.set(paramKey('page'), String(next)); return result })
    const setLimit = (next: number) => setParams(current => { const result = new URLSearchParams(current); result.set(paramKey('limit'), String(next)); result.delete(paramKey('page')); return result })
    const [search, setSearch] = useState(filters.search)
    useEffect(() => { const timer = setTimeout(() => setSearch(filters.search), 300); return () => clearTimeout(timer) }, [filters.search])
    return { filters, queryFilters: { ...filters, search }, setFilters, page, limit, setPage, setLimit }
}
