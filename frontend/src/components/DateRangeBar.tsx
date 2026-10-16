import { Select } from '@/components/ui/Select'
import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useDateRange } from '../context/DateRangeContext'
import { useLanguage } from '../context/LanguageContext'
import { useProfile } from '../context/ProfileContext'
import { useApiQuery } from '../lib/api'

interface LibraryRange { first: string | null; last: string | null; years: number[] }

export function DateRangeBar() {
    const { range, setRange, retry } = useDateRange()
    const { language } = useLanguage()
    const { selectedProfile } = useProfile()
    const pl = language === 'pl'
    const library = useApiQuery<LibraryRange>('/api/stats/library-range?profileId=' + (selectedProfile || 'all'))
    const rawBounds = library.data?.data
    const bounds = rawBounds && Array.isArray(rawBounds.years) ? {
        first: typeof rawBounds.first === 'string' && Number.isFinite(Date.parse(rawBounds.first)) ? rawBounds.first : null,
        last: typeof rawBounds.last === 'string' && Number.isFinite(Date.parse(rawBounds.last)) ? rawBounds.last : null,
        years: rawBounds.years.filter(year => Number.isInteger(year) && year > 0 && year <= 9999),
    } : undefined
    const [draft, setDraft] = useState(range)
    const [custom, setCustom] = useState(false)
    const [error, setError] = useState('')
    useEffect(() => { setDraft(range) }, [range])
    useEffect(() => {
        const report = (event: Event) => setError((event as CustomEvent<string>).detail)
        const clear = () => setError('')
        window.addEventListener('api-error', report)
        window.addEventListener('api-clear-error', clear)
        return () => { window.removeEventListener('api-error', report); window.removeEventListener('api-clear-error', clear) }
    }, [])
    const fullYear = range.dateFrom.endsWith('-01-01') && range.dateTo === range.dateFrom.slice(0, 4) + '-12-31'
    const latestDay = bounds?.last ? new Date(bounds.last).toISOString().slice(0, 10) : ''
    const recentFrom = latestDay ? new Date(Date.parse(latestDay + 'T00:00:00Z') - 29 * 86400000).toISOString().slice(0, 10) : ''
    const preset = !range.dateFrom && !range.dateTo ? 'all' : fullYear ? range.dateFrom.slice(0, 4) : range.dateFrom === recentFrom && range.dateTo === latestDay ? 'recent' : 'custom'
    const years = [...new Set([...(bounds?.years || []), ...(fullYear ? [Number(preset)] : [])])].sort((a, b) => b - a)
    const format = (date: string) => new Date(date).toLocaleDateString(pl ? 'pl-PL' : 'en-GB', { timeZone: 'UTC' })
    const rangeLabel = preset === 'all' ? (pl ? 'Cała historia' : 'All history') :
        [range.dateFrom ? format(range.dateFrom) : '…', range.dateTo ? format(range.dateTo) : '…'].join(' – ')
    const apply = (next: typeof range) => { setRange(next); setCustom(false) }
    return <section className="mb-5 space-y-3" aria-label={pl ? 'Zakres dat' : 'Date range'}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-3">
            <CalendarDays className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />
            <label className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{pl ? 'Okres' : 'Period'}</span>
                <Select className="min-h-10 rounded-md border border-input bg-card px-3 py-2 text-foreground" aria-label={pl ? 'Wybierz okres' : 'Choose period'} value={custom ? 'custom' : preset} onValueChange={value => {
                    if (value === 'custom') { setCustom(true); return }
                    if (value === 'recent') { apply({ dateFrom: recentFrom, dateTo: latestDay }); return }
                    apply(value === 'all' ? { dateFrom: '', dateTo: '' } : { dateFrom: value + '-01-01', dateTo: value + '-12-31' })
                }}>
                    <option value="all">{pl ? 'Cała historia' : 'All history'}</option>
                    {latestDay && <option value="recent">{pl ? 'Ostatnie 30 dni historii' : 'Latest 30 days in history'}</option>}
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                    <option value="custom">{pl ? 'Własny zakres' : 'Custom range'}</option>
                </Select>
            </label>
            {(preset === 'custom' || preset === 'recent') && !custom && <button className="text-sm text-primary underline underline-offset-4" onClick={() => setCustom(true)}>{rangeLabel}</button>}
            <p className="text-xs text-muted-foreground sm:ml-auto">
                {bounds?.first && bounds.last
                    ? (pl ? 'Historia w bibliotece: ' : 'Library history: ') + format(bounds.first) + ' – ' + format(bounds.last)
                    : library.isPending ? (pl ? 'Sprawdzanie zakresu biblioteki…' : 'Checking library range…') : (pl ? 'Brak zakresu historii' : 'No history range')}
                <span className="ml-2">UTC</span>
            </p>
        </div>
        {custom && <form className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4" onSubmit={event => {
            event.preventDefault()
            if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) return
            apply(draft)
        }}>
            <label className="grid gap-1 text-sm">{pl ? 'Od' : 'From'}<input aria-label={pl ? 'Data od' : 'Date from'} className="rounded border bg-background p-2" type="date" value={draft.dateFrom} max={draft.dateTo || undefined} onChange={event => setDraft({ ...draft, dateFrom: event.target.value })} /></label>
            <label className="grid gap-1 text-sm">{pl ? 'Do' : 'To'}<input aria-label={pl ? 'Data do' : 'Date to'} className="rounded border bg-background p-2" type="date" value={draft.dateTo} min={draft.dateFrom || undefined} onChange={event => setDraft({ ...draft, dateTo: event.target.value })} /></label>
            <button className="min-h-10 rounded bg-primary px-4 py-2 text-primary-foreground" type="submit">{pl ? 'Zastosuj' : 'Apply'}</button>
            <button className="min-h-10 rounded border px-3 py-2" type="button" onClick={() => { setDraft(range); setCustom(false) }}>{pl ? 'Anuluj' : 'Cancel'}</button>
            <p className="text-xs text-muted-foreground">{pl ? 'Wspólny zakres dla wszystkich widoków.' : 'Shared across all views.'}</p>
        </form>}
        {error && <div role="alert" className="rounded border border-destructive p-3 text-sm">
            <span>{pl ? 'Nie udało się pobrać części danych.' : 'Some data could not be loaded.'}</span>{' '}
            <button className="underline" onClick={retry}>{pl ? 'Spróbuj ponownie' : 'Retry'}</button>
            <details className="mt-2 text-xs text-muted-foreground"><summary>{pl ? 'Szczegóły błędu' : 'Error details'}</summary>{error}</details>
        </div>}
    </section>
}
