import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useLanguage } from '../../context/LanguageContext'

interface DayOfWeekChartProps {
    data: Array<{ dow: number; plays: number; totalMinutes: number }>
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
    const { t } = useLanguage()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('listeningByWeekday') || 'Listening by Weekday'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height={256} minWidth={0}>
                        <BarChart data={data.map(d => ({
                            dow: d.dow,
                            label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.dow],
                            plays: d.plays,
                            minutes: d.totalMinutes
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis yAxisId="plays" orientation="left" />
                            <YAxis yAxisId="minutes" orientation="right" />
                            <Tooltip formatter={((value: number, name: string) => [value, name === 'plays' ? (t('plays') || 'Plays') : (t('minutes') || 'Minutes')]) as any} />
                            <Legend />
                            <Bar yAxisId="plays" dataKey="plays" name={t('totalPlays') || 'Plays'} fill="#8884d8" />
                            <Bar yAxisId="minutes" dataKey="minutes" name={t('totalMinutes') || 'Minutes'} fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
