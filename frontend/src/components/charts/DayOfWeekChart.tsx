import { MetricBars } from './MetricBars'
import { useLanguage } from '../../context/LanguageContext'
interface DayOfWeekChartProps { data: Array<{ dow: number; plays: number; totalMinutes: number }> }
export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
    const { t, language } = useLanguage()
    return <MetricBars title={t('listeningByWeekday')} description="UTC" data={data.map(row => ({ label: new Intl.DateTimeFormat(language, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + row.dow))), plays: row.plays, minutes: row.totalMinutes }))} />
}
