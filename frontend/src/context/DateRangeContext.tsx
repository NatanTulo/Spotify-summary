import { createContext, useContext, useState, type ReactNode } from 'react'
import { queryClient, setRequestRange } from '../lib/api'
import type { DateRange } from '../../../shared/api'

const DateRangeContext = createContext({ range: { dateFrom: '', dateTo: '' }, setRange: (_value: DateRange) => {}, revision: 0, retry: () => {} })
export const useDateRange = () => useContext(DateRangeContext)
export function DateRangeProvider({ children }: { children: ReactNode }) {
    const [range, updateRange] = useState<DateRange>({ dateFrom: '', dateTo: '' })
    const [revision, setRevision] = useState(0)
    function setRange(value: DateRange) {
        void queryClient.cancelQueries()
        setRequestRange(value)
        updateRange(value)
        window.dispatchEvent(new Event('api-clear-error'))
    }
    function retry() {
        void queryClient.resetQueries()
        setRevision(n => n + 1)
        window.dispatchEvent(new Event('api-clear-error'))
    }
    return <DateRangeContext.Provider value={{ range, setRange, revision, retry }}>{children}</DateRangeContext.Provider>
}
