import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))'
]

interface PlaysByCountryProps {
    data: Array<{
        country: string
        plays: number
        percentage: number
    }>
}

export function PlaysByCountryChart({ data }: PlaysByCountryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Odtworzenia według krajów</CardTitle>
                <CardDescription>Top kraje, w których słuchasz muzyki</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ country, percentage }) => `${country} ${percentage.toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="plays"
                        >
                            {data.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => [value.toLocaleString(), 'Odtworzenia']}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

interface YearlyStatsProps {
    data: Array<{
        year: number
        plays: number
        minutes: number
        topArtist?: string
    }>
}

export function YearlyStatsChart({ data }: YearlyStatsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Statystyki roczne</CardTitle>
                <CardDescription>Twoja aktywność słuchania przez lata</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            dataKey="year"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                            yAxisId="left"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                            formatter={(value: any, name: string) => [
                                name === 'plays' ? value.toLocaleString() : `${Math.round(value).toLocaleString()} min`,
                                name === 'plays' ? 'Odtworzenia' : 'Minuty'
                            ]}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                        <Bar yAxisId="left" dataKey="plays" fill="hsl(var(--primary))" name="plays" />
                        <Bar yAxisId="right" dataKey="minutes" fill="hsl(var(--chart-2))" name="minutes" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

interface TopArtistsProps {
    data: Array<{
        name: string
        plays: number
        minutes: number
    }>
}

export function TopArtistsChart({ data }: TopArtistsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top artyści</CardTitle>
                <CardDescription>Najczęściej słuchani wykonawcy</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} layout="horizontal">
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            type="number"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                            formatter={(value: any) => [value.toLocaleString(), 'Odtworzenia']}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                        <Bar dataKey="plays" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

interface ListeningTimelineProps {
    data: Array<{
        date: string
        plays: number
        minutes: number
    }>
}

export function ListeningTimelineChart({ data }: ListeningTimelineProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Timeline słuchania</CardTitle>
                <CardDescription>Twoja aktywność muzyczna w czasie</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip
                            formatter={(value: any, name: string) => [
                                name === 'plays' ? value.toLocaleString() : `${Math.round(value).toLocaleString()} min`,
                                name === 'plays' ? 'Odtworzenia' : 'Minuty'
                            ]}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--foreground))'
                            }}
                        />
                        <Line type="monotone" dataKey="plays" stroke="hsl(var(--primary))" strokeWidth={2} />
                        <Line type="monotone" dataKey="minutes" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
