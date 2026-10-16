import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { useTracksData } from './useTracksData'
import { useLibraryState } from './useLibraryState'
import type { ReactNode } from 'react'
const { refetch, query } = vi.hoisted(() => ({ refetch: vi.fn(), query: vi.fn() }))
vi.mock('../../../lib/api', () => ({ useApiQuery: (url: string) => { query(url); return { data: { data: [] }, isPending: false, refetch, error: null } } }))
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })
const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/music?dateFrom=2024-01-01&dateTo=2024-12-31&musicPage=3&musicSearch=old&tab=tracks']}>{children}</MemoryRouter>
it('debounces search, resets pagination and keeps global date parameters', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => ({ ...useLibraryState('music'), location: useLocation() }), { wrapper })
    act(() => result.current.setFilters(previous => ({ ...previous, search: 'new artist' })))
    expect(result.current.filters.search).toBe('new artist')
    expect(result.current.queryFilters.search).toBe('old')
    expect(result.current.page).toBe(1)
    expect(result.current.location.search).toContain('dateFrom=2024-01-01')
    expect(result.current.location.search).toContain('dateTo=2024-12-31')
    expect(result.current.location.search).toContain('tab=tracks')
    act(() => vi.advanceTimersByTime(300))
    expect(result.current.queryFilters.search).toBe('new artist')
})
it('refreshes the current query even when no parameters change', () => {
    const { result } = renderHook(() => useTracksData('profile-a'), { wrapper })
    act(() => { result.current.fetchTracks() })
    expect(refetch).toHaveBeenCalledOnce()
    expect(query.mock.calls[query.mock.calls.length - 1]?.[0]).toContain('page=3')
})
it('restores sort, page and search from browser history', async () => {
    const { result } = renderHook(() => ({ ...useLibraryState('music'), navigate: useNavigate() }), { wrapper })
    act(() => result.current.setPage(8))
    expect(result.current.page).toBe(8)
    act(() => result.current.navigate(-1))
    await waitFor(() => expect(result.current.page).toBe(3))
    expect(result.current.filters.search).toBe('old')
})
