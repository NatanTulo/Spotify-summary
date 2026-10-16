import { MetricBars } from './MetricBars'
import { useLanguage } from '../../context/LanguageContext'
interface TimeOfDayChartProps { data: Array<{ hour: number; plays: number; totalMinutes: number }> }
export function TimeOfDayChart({ data }: TimeOfDayChartProps) {
    const { t } = useLanguage()
    return <MetricBars title={t('listeningByHour')} description="UTC" data={data.map(row => ({ label: `${row.hour}:00`, plays: row.plays, minutes: row.totalMinutes }))} />
}
