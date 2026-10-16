import { QueryCache, QueryClient, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { ApiResponse, ApiSuccess } from '../../../shared/api'
import { useDateRange } from '../context/DateRangeContext'

export const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: error => window.dispatchEvent(new CustomEvent('api-error', { detail: error.message })) }),
    defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})
let range = { dateFrom: '', dateTo: '' }
const envelope = z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), data: z.unknown(), pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), pages: z.number() }).optional() }).passthrough(),
    z.object({ success: z.literal(false), error: z.string(), code: z.string() }),
])
export function setRequestRange(value: typeof range) { range = value }
export function scopedUrl(url: string): string {
    const parsed = new URL(url, window.location.origin)
    parsed.searchParams.delete('_t')
    if (!parsed.pathname.startsWith('/api/import')) {
        if (range.dateFrom) parsed.searchParams.set('dateFrom', range.dateFrom)
        if (range.dateTo) parsed.searchParams.set('dateTo', range.dateTo)
    }
    return parsed.pathname + parsed.search
}
export async function request<T>(url: string, signal?: AbortSignal): Promise<ApiSuccess<T>> {
    const response = await window.fetch(url, { signal })
    const parsed = envelope.safeParse(await response.json())
    if (!parsed.success) throw new Error('Invalid API response')
    const body = parsed.data as ApiResponse<T>
    if (!response.ok || body.success === false) throw new Error(body.success === false ? body.error : `HTTP ${response.status}`)
    return body
}
export function useApiQuery<T>(url: string, enabled = true) {
    useDateRange()
    const key = scopedUrl(url)
    return useQuery({ queryKey: ['api', key], queryFn: ({ signal }) => request<T>(key, signal), enabled })
}

// Compatibility adapter for detail panels and polling. Read responses are cached as JSON,
// then recreated, so consuming response.json() never consumes a cached Response object.
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
    const url = scopedUrl(input)
    if (init?.method && init.method !== 'GET') {
        const response = await window.fetch(url, init)
        if (response.ok) await queryClient.invalidateQueries({ queryKey: ['api'] })
        return response
    }
    const body = await queryClient.fetchQuery({
        queryKey: ['api', url], staleTime: url.includes('/import/') ? 0 : 60_000,
        queryFn: ({ signal }) => request<unknown>(url, init?.signal ? AbortSignal.any([signal, init.signal]) : signal),
    })
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
