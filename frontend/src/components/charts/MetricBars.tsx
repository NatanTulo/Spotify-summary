import { Select } from '@/components/ui/Select'
import { useState } from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { useLanguage } from '../../context/LanguageContext'

interface MetricBarsProps { title: string; data: Array<{ label: string; plays: number; minutes: number }>; description?: string }
export function MetricBars({ title, data, description }: MetricBarsProps) {
    const { language, t } = useLanguage()
    const pl = language === 'pl'
    const [metric, setMetric] = useState<'minutes' | 'plays'>('minutes')
    const label = metric === 'minutes' ? pl ? 'Czas (min)' : 'Time (min)' : pl ? 'Odtworzenia' : 'Plays'
    return <Card className="min-w-0"><CardHeader className="pb-3"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-lg">{title}</CardTitle><label className="text-xs text-muted-foreground">{pl ? 'Miara' : 'Metric'} <Select className="rounded border bg-background p-2 text-foreground" value={metric} onValueChange={value => setMetric(value as 'minutes' | 'plays')}><option value="minutes">{pl ? 'Czas (min)' : 'Time (min)'}</option><option value="plays">{pl ? 'Odtworzenia' : 'Plays'}</option></Select></label></div>{description && <p className="text-xs text-muted-foreground">{description}</p>}</CardHeader><CardContent>
        {data.length ? <><div aria-hidden="true"><ResponsiveContainer width="100%" height={256} minWidth={0}><BarChart data={data} accessibilityLayer={false}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip formatter={value => [Number(value).toLocaleString(language), label]} contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} /><Bar dataKey={metric} name={label} fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer></div><details className="mt-3 text-xs"><summary className="min-h-8 cursor-pointer text-primary">{pl ? 'Pokaż dane w tabeli' : 'Show data table'}</summary><div className="overflow-x-auto"><table className="w-full text-right tabular-nums"><caption className="sr-only">{title}</caption><thead><tr><th scope="col" className="py-2 text-left">{pl ? 'Okres' : 'Period'}</th><th scope="col">{pl ? 'Odtworzenia' : 'Plays'}</th><th scope="col">min</th></tr></thead><tbody>{data.map(row => <tr key={row.label} className="border-t"><th scope="row" className="py-2 text-left font-normal">{row.label}</th><td>{row.plays.toLocaleString(language)}</td><td>{row.minutes.toLocaleString(language)}</td></tr>)}</tbody></table></div></details></> : <p className="py-16 text-center text-sm text-muted-foreground">{t('noDataToDisplay')}</p>}
    </CardContent></Card>
}
