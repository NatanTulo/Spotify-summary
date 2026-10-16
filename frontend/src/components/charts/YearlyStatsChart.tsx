import { MetricBars } from './MetricBars'
import { useLanguage } from '../../context/LanguageContext'
interface YearlyStatsProps { data: Array<{ year: number; plays: number; minutes: number; topArtist?: string }> }
export function YearlyStatsChart({ data }: YearlyStatsProps) {
    const { t } = useLanguage()
    return <MetricBars title={t('yearlyStats')} description={t('yearlyStatsDescription')} data={data.map(row => ({ label: String(row.year), plays: row.plays, minutes: row.minutes }))} />
}
