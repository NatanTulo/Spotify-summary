import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Brush } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/Select'
import { useLanguage } from '@/context/LanguageContext'

export interface TimelineRange { dateFrom: string; dateTo: string }
export interface TimelinePoint { date: string; plays: number; minutes: number }
interface ListeningTimelineProps {
    data: TimelinePoint[]
    loading?: boolean
    error?: string
    onRetry?: () => void
    onRangeChange?: (range: TimelineRange | null) => void
    scope?: 'music' | 'podcasts'
}
interface DisplayPoint extends TimelinePoint { endDate?: string }

export function ListeningTimelineChart({ data, loading = false, error, onRetry, onRangeChange, scope = 'music' }: ListeningTimelineProps) {
    const { t, language } = useLanguage()
    const pl = language === 'pl'
    const titleId = useId()
    const [metric, setMetric] = useState<'minutes' | 'plays'>('minutes')
    const [zoom, setZoom] = useState<TimelineRange | null>(null)
    // Keep the selected dates through query refreshes and ranking-only renders.
    const zoomStart = zoom ? data.findIndex(row => row.date === zoom.dateFrom) : -1
    const zoomEnd = zoom ? data.findIndex(row => row.date === zoom.dateTo) : -1
    const start = zoomStart >= 0 && zoomEnd >= zoomStart ? zoomStart : 0
    const end = zoomStart >= 0 && zoomEnd >= zoomStart ? zoomEnd : data.length - 1
    const isZoomed = start !== 0 || end !== data.length - 1
    const selectedFrom = isZoomed ? data[start]?.date : undefined
    const selectedTo = isZoomed ? data[end]?.date : undefined
    const rangeCallback = useRef(onRangeChange)
    useEffect(() => { rangeCallback.current = onRangeChange }, [onRangeChange])
    useEffect(() => {
        rangeCallback.current?.(selectedFrom && selectedTo ? { dateFrom: selectedFrom, dateTo: selectedTo } : null)
    }, [selectedFrom, selectedTo])
    const visible = data.slice(start, end + 1)
    // Every entry contributes exactly once. Bucket totals never overlap with injected raw points.
    const displayData = useMemo(() => {
        const rows = data.slice(start, end + 1)
        const size = rows.length > 500 ? Math.ceil(rows.length / 300) : 1
        const result: DisplayPoint[] = []
        for (let index = 0; index < rows.length; index += size) {
            const bucket = rows.slice(index, index + size)
            result.push({ date: bucket[0].date, endDate: size > 1 ? bucket[bucket.length - 1].date : undefined,
                plays: bucket.reduce((sum, row) => sum + row.plays, 0), minutes: bucket.reduce((sum, row) => sum + row.minutes, 0) })
        }
        return result
    }, [data, start, end])
    const topDays = [...data].filter(day => day[metric] > 0).sort((a, b) => b[metric] - a[metric]).slice(0, 5)
    const unit = metric === 'minutes' ? 'min' : pl ? 'odtworzenia' : 'plays'
    const setRange = (nextStart: number, nextEnd: number) => {
        const from = data[Math.max(0, Math.min(nextStart, nextEnd))]?.date
        const to = data[Math.min(data.length - 1, Math.max(nextStart, nextEnd))]?.date
        if (from && to) setZoom(previous => previous?.dateFrom === from && previous.dateTo === to ? previous : { dateFrom: from, dateTo: to })
    }

    return <Card aria-labelledby={titleId} className="min-w-0">
        <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle id={titleId} className="text-lg">{pl ? 'Historia słuchania' : 'Listening history'}</CardTitle><CardDescription className="mt-1">{scope === 'podcasts' ? pl ? 'Podcasty' : 'Podcasts' : pl ? 'Muzyka' : 'Music'} · UTC · {unit}</CardDescription></div>
            <div role="group" aria-label={pl ? 'Miara wykresu' : 'Chart metric'} className="inline-flex rounded-md border p-1">{(['minutes', 'plays'] as const).map(value => <button key={value} type="button" aria-pressed={metric === value} onClick={() => setMetric(value)} className={`min-h-8 rounded px-3 text-xs font-medium ${metric === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{value === 'minutes' ? pl ? 'Czas' : 'Time' : pl ? 'Odtworzenia' : 'Plays'}</button>)}</div>
        </div></CardHeader>
        <CardContent className="space-y-4">
            {loading ? <p role="status" className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">{t('loading')}</p> : error ? <div role="alert" className="space-y-3 py-12"><p className="text-sm">{pl ? 'Nie udało się wczytać historii słuchania.' : 'Listening history could not be loaded.'}</p>{onRetry && <Button variant="outline" onClick={onRetry}>{pl ? 'Spróbuj ponownie' : 'Try again'}</Button>}</div> : !data.length ? <p className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">{t('noDataToDisplay')}</p> : <>
                <p className="text-xs text-muted-foreground">{data[start]?.date} – {data[end]?.date}{displayData.length < visible.length && (pl ? ' · Sumy w przedziałach dat' : ' · Totals per date bucket')}</p>
                <div aria-hidden="true"><ResponsiveContainer width="100%" height={270} minWidth={0}><LineChart data={displayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer={false}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" minTickGap={38} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={date => date.slice(0, 7)} />
                    <YAxis width={52} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={value => Number(value).toLocaleString(language)} />
                    <Tooltip labelFormatter={(label, payload) => `${label}${payload?.[0]?.payload?.endDate ? ` – ${payload[0].payload.endDate}` : ''}`} formatter={value => [`${Number(value).toLocaleString(language)} ${unit}`, metric === 'minutes' ? pl ? 'Czas' : 'Time' : pl ? 'Odtworzenia' : 'Plays']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: 8 }} />
                    <Line type="linear" dataKey={metric} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart></ResponsiveContainer></div>
                <div className="border-t pt-3"><p className="mb-1 text-xs text-muted-foreground">{t('selectPeriodToZoom')}</p><div aria-hidden="true"><ResponsiveContainer width="100%" height={54} minWidth={0}><LineChart data={data} accessibilityLayer={false}><Line dataKey={metric} stroke="hsl(var(--primary))" dot={false} isAnimationActive={false} /><Brush dataKey="date" height={26} stroke="hsl(var(--primary))" fill="hsl(var(--muted))" startIndex={start} endIndex={end} onChange={range => { if (range.startIndex !== undefined && range.endIndex !== undefined) setRange(range.startIndex, range.endIndex) }} /></LineChart></ResponsiveContainer></div>
                    <div className="mt-2 flex flex-wrap items-end gap-3 text-xs"><label className="grid gap-1">{pl ? 'Powiększ od' : 'Zoom from'}<Select className="max-w-36" aria-label={pl ? 'Powiększ od' : 'Zoom from'} value={start} onValueChange={value => setRange(Number(value), Math.max(Number(value), end))}>{data.map((row, index) => <option key={row.date} value={index}>{row.date}</option>)}</Select></label><label className="grid gap-1">{pl ? 'Powiększ do' : 'Zoom to'}<Select className="max-w-36" aria-label={pl ? 'Powiększ do' : 'Zoom to'} value={end} onValueChange={value => setRange(Math.min(start, Number(value)), Number(value))}>{data.map((row, index) => <option key={row.date} value={index}>{row.date}</option>)}</Select></label>{isZoomed && <button type="button" className="min-h-9 px-2 text-primary underline" onClick={() => setZoom(null)}>{t('resetZoom')}</button>}</div>
                </div>
                <details className="text-xs"><summary className="min-h-8 cursor-pointer font-medium text-primary">{pl ? 'Najaktywniejsze dni' : 'Most active days'}</summary><p className="mb-2 text-muted-foreground">{pl ? 'Pięć dni z najwyższą wartością wybranej miary. Wybierz, aby powiększyć okolicę dnia.' : 'Five days with the highest selected metric. Select one to zoom around that day.'}</p><div className="flex flex-wrap gap-2">{topDays.map(day => <button key={day.date} type="button" className="rounded border border-primary/40 bg-primary/5 px-3 py-2 text-primary" onClick={() => { const index = data.indexOf(day); setRange(index - 30, index + 30) }}>{day.date}: {day[metric].toLocaleString(language)} {unit}</button>)}</div></details>
                <details className="text-xs"><summary className="min-h-8 cursor-pointer font-medium text-primary">{pl ? 'Pokaż dane w tabeli' : 'Show data table'}</summary><div className="max-h-72 overflow-auto"><table className="w-full text-right tabular-nums"><caption className="py-2 text-left text-muted-foreground">{pl ? 'Dane dzienne dla widocznego zakresu. Brak wpisu nie potwierdza braku słuchania; eksport może być niepełny.' : 'Daily data for the visible range. A missing entry does not confirm no listening; the export may be incomplete.'}</caption><thead className="sticky top-0 bg-card"><tr><th scope="col" className="py-2 text-left">{pl ? 'Data' : 'Date'}</th><th scope="col">{pl ? 'Odtworzenia' : 'Plays'}</th><th scope="col">min</th></tr></thead><tbody>{visible.map(row => <tr key={row.date} className="border-t"><th scope="row" className="py-2 text-left font-normal">{row.date}</th><td>{row.plays.toLocaleString(language)}</td><td>{row.minutes.toLocaleString(language)}</td></tr>)}</tbody></table></div></details>
            </>}
        </CardContent>
    </Card>
}
