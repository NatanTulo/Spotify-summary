import { useEffect, useRef, useState } from 'react'
import { useApiQuery } from '../lib/api'
import { useProfile } from '../context/ProfileContext'
import { useDateRange } from '../context/DateRangeContext'
import { useLanguage } from '../context/LanguageContext'
import { countLabel } from '../lib/countLabel'
import type { Insights } from '../../../shared/api'

export function HistoryInsights() {
    const { selectedProfile } = useProfile()
    const { range } = useDateRange()
    const { language } = useLanguage()
    const pl = language === 'pl'
    const [comparison, setComparison] = useState({ compareFrom: '', compareTo: '' })
    const [draft, setDraft] = useState(comparison)
    const params = new URLSearchParams({ profileId: selectedProfile || 'all' })
    if (comparison.compareFrom && comparison.compareTo) Object.entries(comparison).forEach(([key, value]) => params.set(key, value))
    const query = useApiQuery<Insights>(`/api/analytics/insights?${params}`)
    const data = query.data?.data
    const [selectedDay, setSelectedDay] = useState('')
    const [calendarYear, setCalendarYear] = useState<number | null>(null)
    const year = calendarYear || Number(data?.currentRange.dateTo.slice(0, 4)) || new Date().getUTCFullYear()
    const byDate = new Map(data?.calendar.map(day => [day.date, day]))
    const start = Date.UTC(year, 0, 1)
    const days = Math.round((Date.UTC(year + 1, 0, 1) - start) / 86400000)
    const max = Math.max(1, ...Array.from(byDate.values()).map(day => day.plays))
    const years = data ? Array.from(new Set([Number(data.currentRange.dateFrom.slice(0, 4)), Number(data.currentRange.dateTo.slice(0, 4)), ...data.calendar.map(day => Number(day.date.slice(0, 4)))])).sort((a, b) => b - a) : [year]
    const calendar = useRef<HTMLDivElement>(null)
    useEffect(() => { if (calendar.current) calendar.current.scrollLeft = calendar.current.scrollWidth }, [year, data?.calendar])
    return <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="history-insights-title">
        <h2 id="history-insights-title" className="text-xl font-semibold">{pl ? 'Twoja historia w czasie' : 'Your history over time'}</h2>
        {!range.dateFrom && <p className="text-sm text-muted-foreground">{pl ? 'Porównanie domyślnie obejmuje ostatnie 30 dni. Wybierz zakres u góry, aby przeanalizować inny okres.' : 'Comparison defaults to the last 30 days. Select a range above to explore another period.'}</p>}
        <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); setComparison(draft) }}>
            <label className="grid gap-1 text-sm">{pl ? 'Porównaj od' : 'Compare from'}<input className="rounded border bg-background p-2" type="date" required max={draft.compareTo || undefined} value={draft.compareFrom} onChange={e => setDraft({ ...draft, compareFrom: e.target.value })} /></label>
            <label className="grid gap-1 text-sm">{pl ? 'Porównaj do' : 'Compare to'}<input className="rounded border bg-background p-2" type="date" required min={draft.compareFrom || undefined} value={draft.compareTo} onChange={e => setDraft({ ...draft, compareTo: e.target.value })} /></label>
            <button type="submit" className="rounded border px-3 py-2">{pl ? 'Porównaj' : 'Compare'}</button>
            <button type="button" className="rounded border px-3 py-2" onClick={() => { const empty = { compareFrom: '', compareTo: '' }; setDraft(empty); setComparison(empty) }}>{pl ? 'Poprzedni okres' : 'Previous period'}</button>
        </form>
        {query.isPending && <p role="status">{pl ? 'Wczytywanie analiz…' : 'Loading insights…'}</p>}
        {query.error && <p role="alert">{pl ? 'Analiza niedostępna' : 'Insights unavailable'}: {query.error.message}</p>}
        {data && <>
            <p className="text-sm">A: {data.currentRange.dateFrom} – {data.currentRange.dateTo} · B: {data.previousRange.dateFrom} – {data.previousRange.dateTo}</p>
            <div className="overflow-x-auto"><table className="w-full min-w-96 text-left text-sm [&_th]:px-2 [&_td]:px-2"><caption className="sr-only">{pl ? 'Porównanie dwóch okresów' : 'Period comparison'}</caption>
                <thead><tr><th scope="col">{pl ? 'Miara' : 'Metric'}</th><th scope="col">A</th><th scope="col">B</th><th scope="col">{pl ? 'Zmiana' : 'Change'}</th></tr></thead>
                <tbody>{(['plays', 'minutes', 'tracks', 'artists', 'albums', 'podcastPlays', 'audiobookPlays'] as const).map(key => {
                    const a = data.current[key], b = data.previous[key]
                    const label = { plays: pl ? 'Muzyka — odtworzenia' : 'Music plays', minutes: pl ? 'Muzyka — minuty' : 'Music minutes', tracks: pl ? 'Utwory' : 'Tracks', artists: pl ? 'Artyści' : 'Artists', albums: pl ? 'Albumy' : 'Albums', podcastPlays: pl ? 'Podcasty — odtworzenia' : 'Podcast plays', audiobookPlays: pl ? 'Audiobooki — odtworzenia' : 'Audiobook plays' }[key]
                    return <tr key={key} className="border-t"><th scope="row" className="py-2 font-normal">{label}</th><td>{a.toLocaleString(language)}</td><td>{b.toLocaleString(language)}</td><td>{b ? `${((a - b) / b * 100).toFixed(1)}%` : a ? pl ? 'nowe' : 'new' : '—'}</td></tr>
                })}</tbody></table></div>
            <div className="flex flex-wrap items-center gap-3"><h3 className="font-medium">{pl ? 'Kalendarz aktywności' : 'Activity calendar'}</h3><label className="text-sm">{pl ? 'Rok' : 'Year'} <select className="rounded border bg-background p-1" value={year} onChange={event => setCalendarYear(Number(event.target.value))}>{years.map(y => <option key={y}>{y}</option>)}</select></label></div>
            <div ref={calendar} className="overflow-x-auto pb-2"><div className="mb-1 flex w-[848px] justify-between text-xs text-muted-foreground" aria-hidden="true">{Array.from({ length: 12 }, (_, month) => <span key={month}>{new Intl.DateTimeFormat(pl ? 'pl' : 'en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)))}</span>)}</div><div role="group" aria-label={pl ? `Aktywność w roku ${year}; szczegóły dnia po wskazaniu lub tabulatorze` : `Activity in ${year}; focus a day for details`} className="grid w-max grid-flow-col grid-rows-7 gap-1">
                {Array.from({ length: new Date(start).getUTCDay() === 0 ? 6 : new Date(start).getUTCDay() - 1 }, (_, i) => <span key={`pad-${i}`} />)}
                {Array.from({ length: days }, (_, index) => {
                    const date = new Date(start + index * 86400000).toISOString().slice(0, 10)
                    const day = byDate.get(date)
                    const label = `${date}: ${countLabel(day?.plays || 0, 'plays', language)}, ${countLabel(day?.minutes || 0, 'minutes', language)}`
                    return <button key={date} type="button" title={label} aria-label={label} onClick={() => setSelectedDay(label)} onFocus={() => setSelectedDay(label)} className="h-3 w-3 rounded-sm border border-border focus:ring-2 focus:ring-primary" style={{ minHeight: 12, backgroundColor: day ? `color-mix(in srgb, var(--color-primary) ${Math.max(25, (day.plays / max) * 100)}%, var(--color-muted))` : 'var(--color-muted)' }} />
                })}
            </div></div>
            {selectedDay && <p className="text-sm" aria-live="polite">{selectedDay}</p>}
            <p className="text-xs text-muted-foreground">{pl ? 'Wszystkie rodzaje treści; intensywniejszy kolor oznacza więcej odtworzeń. Dni poza zakresem są puste.' : 'All content types; stronger colour mean more plays. Dates outside the range are blank.'}</p>
            <h3 className="font-medium">{pl ? 'Odkryci artyści' : 'New artists'}</h3>
            <p className="text-xs text-muted-foreground">{pl ? 'Pierwsze odtworzenie w całej zaimportowanej historii przypada w wybranym okresie. Do 30 ostatnich odkryć.' : 'First-ever play in the imported history falls within this period. Up to 30 latest discoveries.'}</p>
            {data.discoveries.length ? <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.discoveries.map(artist => <li key={artist.id} className="min-w-0 rounded border p-2 text-sm"><div className="truncate font-medium" title={artist.name}>{artist.name}</div><div className="text-muted-foreground">{artist.firstPlayed} · {countLabel(artist.plays, 'plays', language)}</div></li>)}</ul> : <p className="text-sm text-muted-foreground">{pl ? 'Brak nowych artystów w tym okresie.' : 'No new artists in this period.'}</p>}
        </>}
    </section>
}
