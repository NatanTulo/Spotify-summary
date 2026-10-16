import { useEffect, useState } from 'react'
import { useDateRange } from '../context/DateRangeContext'
import { useLanguage } from '../context/LanguageContext'

export function DateRangeBar() {
    const { range, setRange, retry } = useDateRange()
    const { language } = useLanguage()
    const pl = language === 'pl'
    const [draft, setDraft] = useState(range)
    const [error, setError] = useState('')
    useEffect(() => {
        const report = (event: Event) => setError((event as CustomEvent<string>).detail)
        const clear = () => setError('')
        window.addEventListener('api-error', report)
        window.addEventListener('api-clear-error', clear)
        return () => { window.removeEventListener('api-error', report); window.removeEventListener('api-clear-error', clear) }
    }, [])
    return <section className="mb-5 space-y-3" aria-label={pl ? 'Zakres dat' : 'Date range'}>
        <form className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3" onSubmit={event => {
            event.preventDefault()
            if (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo) return
            setRange(draft)
        }}>
            <label className="grid gap-1 text-sm">{pl ? 'Od' : 'From'}<input aria-label={pl ? 'Data od' : 'Date from'} className="rounded border bg-background p-2" type="date" value={draft.dateFrom} max={draft.dateTo || undefined} onChange={event => setDraft({ ...draft, dateFrom: event.target.value })} /></label>
            <label className="grid gap-1 text-sm">{pl ? 'Do' : 'To'}<input aria-label={pl ? 'Data do' : 'Date to'} className="rounded border bg-background p-2" type="date" value={draft.dateTo} min={draft.dateFrom || undefined} onChange={event => setDraft({ ...draft, dateTo: event.target.value })} /></label>
            <button className="rounded bg-primary px-4 py-2 text-primary-foreground" type="submit">{pl ? 'Zastosuj' : 'Apply'}</button>
            <button className="rounded border px-3 py-2" type="button" onClick={() => { const empty = { dateFrom: '', dateTo: '' }; setDraft(empty); setRange(empty) }}>{pl ? 'Cała historia' : 'All history'}</button>
            <p className="text-xs text-muted-foreground">{pl ? 'Wspólny zakres dla wszystkich zakładek. Daty według UTC.' : 'Shared across all tabs. Dates use UTC.'}</p>
        </form>
        {error && <div role="alert" className="rounded border border-destructive p-3 text-sm">{pl ? 'Nie udało się pobrać danych' : 'Could not load data'}: {error} <button className="underline" onClick={retry}>{pl ? 'Spróbuj ponownie' : 'Retry'}</button></div>}
    </section>
}
