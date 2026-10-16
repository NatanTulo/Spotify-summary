import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { queryClient, setRequestRange } from '../lib/api'
import type { DateRange } from '../../../shared/api'

const DateRangeContext = createContext({ range: { dateFrom: '', dateTo: '' }, setRange: (_value: DateRange) => {}, revision: 0, retry: () => {} })
export const useDateRange = () => useContext(DateRangeContext)
export function validDate(value: string | null): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return ''
    const time = Date.parse(`${value}T00:00:00Z`)
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? value : ''
}
export function DateRangeProvider({ children }: { children: ReactNode }) {
    const [params, setParams] = useSearchParams()
    const range = useMemo(() => {
        const dateFrom = validDate(params.get('dateFrom'))
        const dateTo = validDate(params.get('dateTo'))
        return dateFrom && dateTo && dateFrom > dateTo ? { dateFrom: '', dateTo: '' } : { dateFrom, dateTo }
    }, [params])
    // Keep legacy imperative detail requests in sync before children read data.
    setRequestRange(range)
    const [revision, setRevision] = useState(0)
    function setRange(value: DateRange) {
        void queryClient.cancelQueries()
        setParams(previous => {
            const next = new URLSearchParams(previous)
            for (const key of ['dateFrom', 'dateTo'] as const) {
                if (value[key]) next.set(key, value[key])
                else next.delete(key)
            }
            next.delete('musicPage')
            next.delete('albumsPage')
            return next
        })
        window.dispatchEvent(new Event('api-clear-error'))
    }
    function retry() {
        void queryClient.resetQueries()
        setRevision(n => n + 1)
        window.dispatchEvent(new Event('api-clear-error'))
    }
    return <DateRangeContext.Provider value={{ range, setRange, revision, retry }}>{children}</DateRangeContext.Provider>
}
