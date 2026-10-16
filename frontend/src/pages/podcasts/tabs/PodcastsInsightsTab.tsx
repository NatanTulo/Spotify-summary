import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLanguage } from '@/context/LanguageContext'
import { DailyStats } from '../types'
interface PodcastsInsightsTabProps { dailyStats: DailyStats[] }
export function PodcastsInsightsTab({ dailyStats }: PodcastsInsightsTabProps) {
    const { t, language } = useLanguage()
    const pl = language === 'pl'
    const days = [...dailyStats].filter(day => Number(day.plays) > 0).sort((a, b) => a.date.localeCompare(b.date))
    let longest = 0
    let streak = 0
    days.forEach((day, index) => {
        streak = index > 0 && Date.parse(`${day.date}T00:00:00Z`) - Date.parse(`${days[index - 1].date}T00:00:00Z`) === 86400000 ? streak + 1 : 1
        longest = Math.max(longest, streak)
    })
    const peak = days.reduce<DailyStats | null>((best, day) => !best || day.plays > best.plays ? day : best, null)
    const plays = days.reduce((total, day) => total + Number(day.plays), 0)
    const minutes = days.reduce((total, day) => total + Number(day.minutes), 0)
    return <Card><CardHeader><CardTitle className="text-lg">{t('quickInsights')}</CardTitle><CardDescription>{pl ? 'Podcasty w wybranym okresie · dni według UTC. Obliczenia na podstawie zapisów w eksporcie.' : 'Podcasts in the selected period · UTC days. Calculated from recorded export entries.'}</CardDescription></CardHeader><CardContent>{days.length ? <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {[
            { label: pl ? 'Dni z odtworzeniami' : 'Days with plays', value: days.length.toLocaleString(language), detail: `${days[0].date} – ${days[days.length - 1].date}` },
            { label: pl ? 'Najdłuższa seria dni' : 'Longest daily streak', value: longest.toLocaleString(language), detail: pl ? 'Kolejne dni UTC z odtworzeniem' : 'Consecutive UTC days with a play' },
            { label: pl ? 'Najwięcej odtworzeń w dniu' : 'Most plays in a day', value: peak?.plays.toLocaleString(language), detail: peak?.date },
            { label: pl ? 'Średnia na aktywny dzień' : 'Average per active day', value: `${Math.round(minutes / days.length).toLocaleString(language)} min`, detail: `${Math.round(plays / days.length).toLocaleString(language)} ${pl ? 'odtworzeń' : 'plays'}` },
        ].map(item => <div key={item.label} className="border-l-2 pl-3"><dt className="text-sm text-muted-foreground">{item.label}</dt><dd className="my-2 text-3xl font-semibold tabular-nums">{item.value}</dd><p className="text-xs text-muted-foreground">{item.detail}</p></div>)}
    </dl> : <p className="text-sm text-muted-foreground">{t('noDataToDisplay')}</p>}</CardContent></Card>
}
