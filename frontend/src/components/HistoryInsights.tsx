import { useState } from 'react'
import { useApiQuery } from '../lib/api'
import { useProfile } from '../context/ProfileContext'
import { useDateRange } from '../context/DateRangeContext'
import { useLanguage } from '../context/LanguageContext'
import { countLabel } from '../lib/countLabel'
import { Select } from '@/components/ui/Select'
import type { CalendarDay, Insights } from '../../../shared/api'

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
    return <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6" aria-labelledby="history-insights-title">
        <h2 id="history-insights-title" className="text-xl font-semibold">{pl ? 'Twoja historia w czasie' : 'Your history over time'}</h2>
        {!range.dateFrom && !range.dateTo && <p className="text-sm text-muted-foreground">{pl ? 'Porównanie domyślnie obejmuje 30 dni do ostatniego wpisu w imporcie. Zakres u góry zmienia porównanie, a kalendarz ma niezależny wybór roku.' : 'Comparison defaults to 30 days ending at the latest imported entry. The range above changes the comparison; the calendar has its own year selection.'}</p>}
        <h3 className="font-medium">{pl ? 'Porównanie okresów' : 'Period comparison'}</h3>
        {(range.dateFrom || range.dateTo) && <p className="text-sm text-muted-foreground">{pl ? 'Porównanie korzysta z zakresu dat wybranego u góry. Rok kalendarza wybierasz niezależnie poniżej.' : 'The comparison uses the date range selected above. Choose the calendar year independently below.'}</p>}
        <form className="flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); setComparison(draft) }}>
            <label className="grid gap-1 text-sm">{pl ? 'Porównaj od' : 'Compare from'}<input className="rounded border bg-background p-2" type="date" required max={draft.compareTo || undefined} value={draft.compareFrom} onChange={e => setDraft({ ...draft, compareFrom: e.target.value })} /></label>
            <label className="grid gap-1 text-sm">{pl ? 'Porównaj do' : 'Compare to'}<input className="rounded border bg-background p-2" type="date" required min={draft.compareFrom || undefined} value={draft.compareTo} onChange={e => setDraft({ ...draft, compareTo: e.target.value })} /></label>
            <button type="submit" className="rounded border px-3 py-2">{pl ? 'Porównaj' : 'Compare'}</button>
            <button type="button" className="rounded border px-3 py-2" onClick={() => { const empty = { compareFrom: '', compareTo: '' }; setDraft(empty); setComparison(empty) }}>{pl ? 'Poprzedni okres' : 'Previous period'}</button>
        </form>
        {query.isPending && <p role="status">{pl ? 'Wczytywanie analiz…' : 'Loading insights…'}</p>}
        {query.error && <div role="alert" className="space-y-2"><p>{pl ? 'Analiza niedostępna' : 'Insights unavailable'}: {query.error.message}</p><button type="button" className="min-h-9 rounded border px-3 text-sm" onClick={() => void query.refetch()}>{pl ? 'Spróbuj ponownie' : 'Try again'}</button></div>}
        {data && <>
            <p className="text-sm">{pl ? 'Okres A' : 'Period A'}: {data.currentRange.dateFrom} – {data.currentRange.dateTo} · {pl ? 'Okres B' : 'Period B'}: {data.previousRange.dateFrom} – {data.previousRange.dateTo}</p>
            <div className="overflow-x-auto"><table className="w-full min-w-96 text-left text-sm [&_th]:px-2 [&_td]:px-2"><caption className="sr-only">{pl ? 'Porównanie dwóch okresów' : 'Period comparison'}</caption>
                <thead><tr><th scope="col">{pl ? 'Miara' : 'Metric'}</th><th scope="col">A</th><th scope="col">B</th><th scope="col">{pl ? 'Zmiana' : 'Change'}</th></tr></thead>
                <tbody>{(['plays', 'minutes', 'tracks', 'artists', 'albums', 'podcastPlays', 'audiobookPlays'] as const).map(key => {
                    const a = data.current[key], b = data.previous[key]
                    const label = { plays: pl ? 'Muzyka — odtworzenia' : 'Music plays', minutes: pl ? 'Muzyka — minuty' : 'Music minutes', tracks: pl ? 'Utwory' : 'Tracks', artists: pl ? 'Artyści' : 'Artists', albums: pl ? 'Albumy' : 'Albums', podcastPlays: pl ? 'Podcasty — odtworzenia' : 'Podcast plays', audiobookPlays: pl ? 'Audiobooki — odtworzenia' : 'Audiobook plays' }[key]
                    return <tr key={key} className="border-t"><th scope="row" className="py-2 font-normal">{label}</th><td>{a.toLocaleString(language)}</td><td>{b.toLocaleString(language)}</td><td>{b ? `${((a - b) / b * 100).toFixed(1)}%` : a ? pl ? 'nowe' : 'new' : '—'}</td></tr>
                })}</tbody></table></div>
        </>}
        <ActivityCalendar key={selectedProfile || 'all'} />
        {data && <>
            <h3 className="font-medium">{pl ? 'Odkryci artyści' : 'New artists'}</h3>
            <p className="text-xs text-muted-foreground">{pl ? 'Pierwsze odtworzenie w całej zaimportowanej historii przypada w wybranym okresie. Do 30 ostatnich odkryć.' : 'First-ever play in the imported history falls within this period. Up to 30 latest discoveries.'}</p>
            {data.discoveries.length ? <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{data.discoveries.map(artist => <li key={artist.id} className="min-w-0 rounded border p-2 text-sm"><div className="truncate font-medium" title={artist.name}>{artist.name}</div><div className="text-muted-foreground">{artist.firstPlayed} · {countLabel(artist.plays, 'plays', language)}</div></li>)}</ul> : <p className="text-sm text-muted-foreground">{pl ? 'Brak nowych artystów w tym okresie.' : 'No new artists in this period.'}</p>}
        </>}
    </section>
}

interface LibraryBounds { first: string | null; last: string | null; years: number[] }
function ActivityCalendar() {
    const { selectedProfile } = useProfile()
    const { language } = useLanguage()
    const pl = language === 'pl'
    const profile = selectedProfile || 'all'
    const bounds = useApiQuery<LibraryBounds>(`/api/stats/library-range?profileId=${profile}`, true, { dateFrom: '', dateTo: '' })
    const library = bounds.data?.data
    const years = [...(library?.years || [])].sort((a, b) => b - a)
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const year = selectedYear && years.includes(selectedYear) ? selectedYear : years[0]
    const calendarRange = { dateFrom: year ? `${year}-01-01` : '', dateTo: year ? `${year}-12-31` : '' }
    const calendar = useApiQuery<CalendarDay[]>(`/api/analytics/calendar?profileId=${profile}`, !!year, calendarRange)
    const days = calendar.data?.data || []
    const byDate = new Map(days.map(day => [day.date, day]))
    const max = Math.max(1, ...days.map(day => day.plays))
    const [selectedDay, setSelectedDay] = useState('')
    const start = Date.UTC(year || 2000, 0, 1)
    const dayCount = Math.round((Date.UTC((year || 2000) + 1, 0, 1) - start) / 86400000)
    const offset = (new Date(start).getUTCDay() + 6) % 7
    const columns = Math.ceil((offset + dayCount) / 7)
    const first = library?.first?.slice(0, 10)
    const last = library?.last?.slice(0, 10)
    const calendarError = bounds.error || calendar.error
    const loading = bounds.isPending || (!!year && calendar.isPending)
    return <section className="space-y-3 border-t pt-5" aria-labelledby="activity-calendar-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="activity-calendar-title" className="font-medium">{pl ? 'Kalendarz aktywności' : 'Activity calendar'}</h3>{years.length > 0 && <label className="flex items-center gap-2 text-sm">{pl ? 'Rok' : 'Year'}<Select aria-label={pl ? 'Rok kalendarza' : 'Calendar year'} className="w-28" value={year} onValueChange={value => { setSelectedYear(Number(value)); setSelectedDay('') }}>{years.map(value => <option key={value} value={value}>{value}</option>)}</Select></label>}</div>
        <p className="text-xs text-muted-foreground">{pl ? 'Cały wybrany rok, niezależnie od porównania okresów. Wszystkie rodzaje treści · UTC.' : 'The full selected year, independent of the period comparison. All content types · UTC.'}</p>
        {loading ? <p role="status" className="py-6 text-sm text-muted-foreground">{pl ? 'Wczytywanie kalendarza…' : 'Loading calendar…'}</p> : calendarError ? <div role="alert" className="space-y-2"><p className="text-sm">{pl ? 'Nie udało się pobrać kalendarza.' : 'The calendar could not be loaded.'}</p><button type="button" className="min-h-9 rounded border px-3 text-sm" onClick={() => { void bounds.refetch(); if (year) void calendar.refetch() }}>{pl ? 'Spróbuj ponownie' : 'Try again'}</button></div> : !year ? <p className="py-4 text-sm text-muted-foreground">{pl ? 'Brak zaimportowanej historii dla tej biblioteki.' : 'No imported history for this library.'}</p> : <>
            <div className="overflow-x-auto pb-2"><div style={{ width: columns * 16 + 28 }}>
                <div aria-hidden="true" className="mb-2 ml-8 grid text-xs text-muted-foreground" style={{ gridTemplateColumns: `repeat(${columns}, 16px)` }}>{Array.from({ length: 12 }, (_, month) => {
                    const monthDay = Math.round((Date.UTC(year, month, 1) - start) / 86400000)
                    const nextMonthDay = Math.round((Date.UTC(year, month + 1, 1) - start) / 86400000)
                    const column = Math.floor((offset + monthDay) / 7)
                    const nextColumn = month === 11 ? columns : Math.floor((offset + nextMonthDay) / 7)
                    return <span key={month} style={{ gridColumn: `${column + 1} / span ${nextColumn - column}` }}>{new Intl.DateTimeFormat(language, { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)))}</span>
                })}</div>
                <div className="flex gap-2"><div aria-hidden="true" className="grid w-6 shrink-0 grid-rows-7 gap-1 text-[10px] leading-3 text-muted-foreground">{Array.from({ length: 7 }, (_, index) => <span key={index}>{[0, 2, 4].includes(index) ? new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + index))) : ''}</span>)}</div>
                    <div role="group" aria-label={pl ? `Aktywność w roku ${year}; szczegóły dnia po wskazaniu lub tabulatorze` : `Activity in ${year}; focus a day for details`} className="grid w-max grid-flow-col grid-rows-7 gap-1">
                        {Array.from({ length: offset }, (_, index) => <span key={`pad-${index}`} />)}
                        {Array.from({ length: dayCount }, (_, index) => {
                            const date = new Date(start + index * 86400000).toISOString().slice(0, 10)
                            const day = byDate.get(date)
                            const outside = !!first && !!last && (date < first || date > last)
                            const label = `${date}: ${outside ? pl ? 'poza pokryciem importu' : 'outside import coverage' : day ? `${countLabel(day.plays, 'plays', language)}, ${countLabel(day.minutes, 'minutes', language)}` : pl ? 'brak wpisów w eksporcie' : 'no entries in the export'}`
                            return <button key={date} type="button" title={label} aria-label={label} onClick={() => setSelectedDay(label)} onFocus={() => setSelectedDay(label)} className="h-3 w-3 rounded-sm border border-border focus:ring-2 focus:ring-primary" style={{ minHeight: 12, opacity: outside ? 0.3 : 1, backgroundColor: day ? `color-mix(in srgb, var(--color-primary) ${Math.max(25, day.plays / max * 100)}%, var(--color-muted))` : 'var(--color-muted)' }} />
                        })}
                    </div>
                </div>
            </div></div>
            {selectedDay && <p className="text-sm" aria-live="polite">{selectedDay}</p>}
            <p className="text-xs text-muted-foreground">{pl ? `Pokrycie biblioteki: ${first} – ${last}. Intensywniejszy kolor oznacza więcej odtworzeń; przygaszone dni są poza pokryciem importu. Brak wpisów nie potwierdza braku słuchania — eksport może być niepełny.` : `Library coverage: ${first} – ${last}. Stronger colour means more plays; dimmed days are outside import coverage. Missing entries do not confirm no listening — the export may be incomplete.`}</p>
        </>}
    </section>
}
