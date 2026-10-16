import type { ReactNode } from 'react'
import { act } from '@testing-library/react'
import { expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { ListeningTimelineChart } from './ListeningTimelineChart'
const brush = vi.hoisted(() => ({ onChange: undefined as undefined | ((range: { startIndex: number; endIndex: number }) => void) }))
vi.mock('@/components/ui/Select', () => ({ Select: ({ value, onValueChange, children, ...props }: { value: string | number; onValueChange: (value: string) => void; children: ReactNode }) => <select {...props} value={value} onChange={event => onValueChange(event.target.value)}>{children}</select> }))
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: ReactNode }) => children, LineChart: ({ children }: { children: ReactNode }) => children, Line: () => null, XAxis: () => null, YAxis: () => null,
    CartesianGrid: () => null, Tooltip: () => null, Brush: ({ onChange }: { onChange: typeof brush.onChange }) => { brush.onChange = onChange; return null },
}))
const data = [
    { date: '2025-01-01', plays: 2, minutes: 8 },
    { date: '2025-01-03', plays: 5, minutes: 15 },
    { date: '2025-01-04', plays: 1, minutes: 4 },
]
beforeEach(cleanup)
it('starts with a single time metric, switches to plays, and provides original daily values in a table', () => {
    render(<LanguageProvider><ListeningTimelineChart data={data} /></LanguageProvider>)
    expect(screen.getByRole('button', { name: 'Czas' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Odtworzenia' }))
    expect(screen.getByRole('button', { name: 'Odtworzenia' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByText('Pokaż dane w tabeli'))
    expect(screen.getByRole('row', { name: '2025-01-03 5 15' })).toBeInTheDocument()
    expect(screen.getByText(/eksport może być niepełny/)).toBeInTheDocument()
})
it('supports keyboard accessible zoom and resets to the full range', () => {
    render(<LanguageProvider><ListeningTimelineChart data={data} /></LanguageProvider>)
    fireEvent.change(screen.getByLabelText('Powiększ od'), { target: { value: '1' } })
    fireEvent.click(screen.getByText('Pokaż dane w tabeli'))
    expect(screen.queryByRole('row', { name: '2025-01-01 2 8' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(screen.getByRole('row', { name: '2025-01-01 2 8' })).toBeInTheDocument()
})
it('shows fetch failure with a retry action instead of an empty chart', () => {
    const retry = vi.fn()
    render(<LanguageProvider><ListeningTimelineChart data={[]} error="offline" onRetry={retry} /></LanguageProvider>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(retry).toHaveBeenCalledOnce()
    expect(screen.queryByText('Pokaż dane w tabeli')).not.toBeInTheDocument()
})

it('emits visible date bounds for keyboard and brush zoom, then null on reset', () => {
    const onRangeChange = vi.fn()
    render(<LanguageProvider><ListeningTimelineChart data={data} onRangeChange={onRangeChange} /></LanguageProvider>)
    expect(onRangeChange).toHaveBeenLastCalledWith(null)
    fireEvent.change(screen.getByLabelText('Powiększ od'), { target: { value: '1' } })
    expect(onRangeChange).toHaveBeenLastCalledWith({ dateFrom: '2025-01-03', dateTo: '2025-01-04' })
    act(() => brush.onChange?.({ startIndex: 1, endIndex: 1 }))
    expect(onRangeChange).toHaveBeenLastCalledWith({ dateFrom: '2025-01-03', dateTo: '2025-01-03' })
    fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
    expect(onRangeChange).toHaveBeenLastCalledWith(null)
})
it('retains zoom across equivalent data arrays and parent callback identity changes without repeated notifications', () => {
    const onRangeChange = vi.fn()
    const view = render(<LanguageProvider><ListeningTimelineChart data={data} onRangeChange={onRangeChange} /></LanguageProvider>)
    fireEvent.change(screen.getByLabelText('Powiększ od'), { target: { value: '1' } })
    onRangeChange.mockClear()
    const nextCallback = vi.fn()
    view.rerender(<LanguageProvider><ListeningTimelineChart data={data.map(row => ({ ...row }))} onRangeChange={nextCallback} /></LanguageProvider>)
    expect(screen.getByLabelText('Powiększ od')).toHaveValue('1')
    expect(onRangeChange).not.toHaveBeenCalled()
    expect(nextCallback).not.toHaveBeenCalled()
    view.rerender(<LanguageProvider><ListeningTimelineChart data={[{ date: '2026-01-01', plays: 1, minutes: 2 }]} onRangeChange={nextCallback} /></LanguageProvider>)
    expect(nextCallback).toHaveBeenLastCalledWith(null)
})
it('reports the dates selected by most-active-day zoom', () => {
    const days = Array.from({ length: 100 }, (_, index) => ({ date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10), plays: index === 50 ? 20 : 1, minutes: index === 50 ? 30 : 2 }))
    const onRangeChange = vi.fn()
    render(<LanguageProvider><ListeningTimelineChart data={days} onRangeChange={onRangeChange} /></LanguageProvider>)
    fireEvent.click(screen.getByText('Najaktywniejsze dni'))
    fireEvent.click(screen.getByRole('button', { name: `${days[50].date}: 30 min` }))
    expect(onRangeChange).toHaveBeenLastCalledWith({ dateFrom: days[20].date, dateTo: days[80].date })
})
