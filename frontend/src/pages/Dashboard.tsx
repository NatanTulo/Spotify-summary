import { useEffect, useState } from 'react'
import type { TimelineRange } from '../components/charts/ListeningTimelineChart'
import { Link, useSearchParams } from 'react-router-dom'
import { countLabel } from '../lib/countLabel'
import { HistoryInsights } from '../components/HistoryInsights'
import { ListeningTimelineChart } from '../components/charts/ListeningTimelineChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProfile } from '../context/ProfileContext'
import { useLanguage } from '../context/LanguageContext'
import { useDashboardStats, type ChartItem } from '../hooks/useDashboardStats'

const Dashboard = () => {
    const [searchParams] = useSearchParams()
    const dates = new URLSearchParams()
    for (const key of ['dateFrom', 'dateTo']) { const value = searchParams.get(key); if (value) dates.set(key, value) }
    const dateSearch = dates.size ? `?${dates}` : ''
    const { selectedProfile } = useProfile()
    const { t, language } = useLanguage()
    const pl = language === 'pl'
    const [followChart, setFollowChart] = useState(() => {
        try { return localStorage.getItem('dashboard-follow-chart-range') !== 'false' } catch { return true }
    })
    const [chartRange, setChartRange] = useState<TimelineRange | null>(null)
    useEffect(() => { try { localStorage.setItem('dashboard-follow-chart-range', String(followChart)) } catch { /* Preference still works in memory. */ } }, [followChart])
    const rankingRange = followChart ? chartRange : null
    const { stats, statsAvailable, podcastStats, topTracks, topArtists, loading, error, fetchDashboardData,
        timeline = [], timelineLoading, timelineError, retryTimeline, rankingsLoading, rankingsError, retryRankings } = useDashboardStats(selectedProfile, rankingRange)
    const number = (value: number) => value.toLocaleString(language)
    const hasData = stats.totalPlays > 0 || podcastStats.totalPodcastPlays > 0
    const rankFrom = rankingRange?.dateFrom || searchParams.get('dateFrom') || timeline[0]?.date
    const rankTo = rankingRange?.dateTo || searchParams.get('dateTo') || timeline[timeline.length - 1]?.date
    const rankingLabel = rankFrom && rankTo ? `${rankFrom} – ${rankTo} · UTC` : pl ? 'Cała historia · UTC' : 'All history · UTC'
    const ranking = (title: string, items: ChartItem[]) => <section aria-label={title}>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{pl ? 'Muzyka · według liczby odtworzeń' : 'Music · ranked by plays'}</p>
        {items.length ? <ol className="mt-2 divide-y divide-border">{items.slice(0, 5).map((item, index) => <li key={`${index}-${item.name}`} className="flex min-h-12 items-center gap-3 py-2">
            <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={item.name}>{item.name}</p>{item.artist && <p className="truncate text-xs text-muted-foreground" title={item.artist}>{item.artist}</p>}</div>
            <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">{countLabel(item.plays, 'plays', language)}</span>
        </li>)}</ol> : <p className="py-5 text-sm text-muted-foreground">{t('noDataToDisplay')}</p>}
    </section>

    return <div className="space-y-6">
        <header><h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1><p className="mt-1 text-sm text-muted-foreground">{pl ? 'Historia słuchania i najczęstsze powroty w wybranym okresie.' : 'Your listening history and most revisited music in the selected period.'}</p></header>
        {loading && <p role="status" className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">{t('loading')}</p>}
        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-card p-4"><p className="text-sm">{pl ? 'Nie udało się pobrać części podsumowania.' : 'Some summary data could not be loaded.'}</p><Button variant="outline" onClick={() => void fetchDashboardData()}>{pl ? 'Spróbuj ponownie' : 'Try again'}</Button></div>}
        {!loading && !error && !hasData ? <Card><CardHeader><CardTitle>{pl ? 'Brak aktywności w tym zakresie' : 'No activity in this range'}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="max-w-xl text-sm text-muted-foreground">{pl ? 'Wybierz inny okres lub przejdź do danych i importu, aby sprawdzić zawartość biblioteki.' : 'Select another period or open data and import to check your library.'}</p><Link to={`/data${dateSearch}`} className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium text-primary">{pl ? 'Dane i import' : 'Data and import'}</Link></CardContent></Card> : <>
            <section aria-label={pl ? 'Muzyka w wybranym okresie' : 'Music in the selected period'} className="grid grid-cols-2 gap-x-5 gap-y-6 py-2 lg:grid-cols-4">
                {[
                    { label: t('listeningMinutes'), value: number(stats.totalMinutes), detail: `≈ ${number(Math.round(stats.totalMinutes / 60))} ${t('approxHours')}` },
                    { label: t('totalPlaysCard'), value: number(stats.totalPlays), detail: pl ? 'Wpisy w historii muzyki' : 'Music history entries' },
                    { label: t('uniqueTracksCard'), value: number(stats.uniqueTracks), detail: t('differentSongs') },
                    { label: t('uniqueArtistsCard'), value: number(stats.uniqueArtists), detail: t('differentArtists') },
                ].map((item, index) => <div key={item.label} className={`min-w-0 border-l-2 pl-4 ${index === 0 ? 'border-primary' : 'border-border'}`}><h2 className="text-sm text-muted-foreground">{item.label}</h2><p className="my-2 text-3xl font-semibold tracking-tight tabular-nums">{!statsAvailable ? '—' : item.value}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div>)}
            </section>
            <p className="!mt-3 text-xs text-muted-foreground">{pl ? 'Cztery miary powyżej dotyczą wyłącznie muzyki w wybranym okresie. Daty agregowane w UTC.' : 'The four metrics above cover music only in the selected period. Dates are aggregated in UTC.'}</p>
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
                <ListeningTimelineChart data={timeline} loading={timelineLoading} error={timelineError?.message} onRetry={() => void retryTimeline?.()} onRangeChange={setChartRange} />
                <div className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
                    <div className="space-y-2 border-b pb-4">
                        <label className="flex items-start gap-2 text-sm"><input className="mt-1 shrink-0" type="checkbox" checked={followChart} onChange={event => setFollowChart(event.target.checked)} /><span>{pl ? 'Dopasuj rankingi do zakresu wykresu' : 'Match rankings to the chart range'}</span></label>
                        <p className="text-xs text-muted-foreground">{rankingRange ? pl ? 'Zakres rankingu: ' : 'Ranking range: ' : pl ? 'Cały wybrany okres: ' : 'Full selected period: '}{rankingLabel}</p>
                    </div>
                    {rankingsError ? <div role="alert" className="space-y-2 text-sm"><p>{pl ? 'Nie udało się pobrać rankingów dla tego zakresu.' : 'Could not load rankings for this range.'}</p><Button variant="outline" onClick={() => void retryRankings?.()}>{pl ? 'Spróbuj ponownie' : 'Try again'}</Button></div> : rankingsLoading ? <p role="status" className="py-8 text-sm text-muted-foreground">{pl ? 'Wczytywanie rankingów dla tego zakresu…' : 'Loading rankings for this range…'}</p> : <>{ranking(t('topTracksTitle'), topTracks)}{ranking(t('topArtistsTitle'), topArtists)}</>}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-y py-3 text-sm"><p className="text-muted-foreground">{podcastStats.totalPodcastPlays ? `${t('podcasts')}: ${countLabel(podcastStats.totalPodcastPlays, 'plays', language)}, ${countLabel(podcastStats.totalPodcastMinutes, 'minutes', language)}` : pl ? 'Brak odtworzeń podcastów w wybranym okresie.' : 'No podcast plays in the selected period.'}</p><Link to={`/podcasts${dateSearch}`} className="font-medium text-primary hover:underline">{pl ? 'Przejdź do podcastów' : 'View podcasts'}</Link></div>
        </>}
        <HistoryInsights />
    </div>
}
export default Dashboard
