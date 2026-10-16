import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { useTrackDetails } from './useTrackDetails'
const envelope = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
afterEach(() => vi.restoreAllMocks())
it('keeps the new track when an older request completes later', async () => {
    let resolveOld!: (response: Response) => void
    const old = new Promise<Response>(resolve => { resolveOld = resolve })
    vi.spyOn(window, 'fetch').mockImplementation(async input => {
        const url = String(input)
        if (url.includes('/timeline?') || url.includes('/plays?')) return envelope([])
        if (url.includes('/old?')) return old
        return envelope({ id: 'new', name: 'New track', stats: {} })
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result, rerender } = renderHook(({ id }) => useTrackDetails(id), { wrapper, initialProps: { id: 'old' } })
    rerender({ id: 'new' })
    await waitFor(() => expect(result.current.track?.trackName).toBe('New track'))
    await act(async () => { resolveOld(envelope({ id: 'old', name: 'Old track', stats: {} })); await old })
    expect(result.current.track?.trackName).toBe('New track')
    client.clear()
})
