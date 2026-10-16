import { renderHook } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useDashboardStats } from './useDashboardStats'
const mocks = vi.hoisted(() => ({
    calls: [] as { url: string; enabled: boolean; range?: { dateFrom: string; dateTo: string } }[],
    rankingPending: false,
    refetch: vi.fn(),
    timeline: { data: [{ period: '2025-01-01', plays: 2, totalMinutes: 5 }] },
}))
vi.mock('../lib/api', () => ({ useApiQuery: (url: string, enabled = true, range?: { dateFrom: string; dateTo: string }) => {
    mocks.calls.push({ url, enabled, range })
    const isRank = url.startsWith('/api/tracks?') || url.startsWith('/api/artists/top?')
    return { data: url.startsWith('/api/stats/timeline?') ? mocks.timeline : undefined, isSuccess: true, isPending: isRank && mocks.rankingPending, isFetching: isRank && mocks.rankingPending, error: null, refetch: mocks.refetch }
} }))
beforeEach(() => { mocks.calls = []; mocks.rankingPending = false; mocks.refetch.mockClear() })
it('scopes only track and artist ranks to the chart dates, leaving headline and timeline queries in the global period', () => {
    const range = { dateFrom: '2025-01-03', dateTo: '2025-02-04' }
    renderHook(() => useDashboardStats('7', range))
    const ranks = mocks.calls.filter(call => call.range)
    expect(ranks).toHaveLength(2)
    expect(ranks.map(call => call.url)).toEqual(['/api/tracks?limit=5&sortBy=totalPlays&sortOrder=desc&profileId=7', '/api/artists/top?limit=5&profileId=7'])
    expect(ranks.every(call => call.range === range && call.enabled)).toBe(true)
    expect(mocks.calls.find(call => call.url.startsWith('/api/stats/overview?'))?.range).toBeUndefined()
    expect(mocks.calls.find(call => call.url.startsWith('/api/stats/timeline?'))?.range).toBeUndefined()
    expect(mocks.calls.find(call => call.url.startsWith('/api/podcasts/stats?'))?.range).toBeUndefined()
})
it('uses the global period again with no range and keeps timeline identity stable when the ranking range changes', () => {
    const { result, rerender } = renderHook(({ range }) => useDashboardStats(null, range), { initialProps: { range: null as null | { dateFrom: string; dateTo: string } } })
    const timeline = result.current.timeline
    expect(mocks.calls.every(call => !call.range)).toBe(true)
    rerender({ range: { dateFrom: '2025-01-03', dateTo: '2025-02-04' } })
    expect(result.current.timeline).toBe(timeline)
    mocks.calls = []
    rerender({ range: null })
    expect(mocks.calls.every(call => !call.range)).toBe(true)
})
it('keeps ranking loading independent from summary and timeline loading and retries both rank endpoints', () => {
    mocks.rankingPending = true
    const { result } = renderHook(() => useDashboardStats(null))
    expect(result.current.rankingsLoading).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.timelineLoading).toBe(false)
    result.current.retryRankings()
    expect(mocks.refetch).toHaveBeenCalledTimes(2)
})
