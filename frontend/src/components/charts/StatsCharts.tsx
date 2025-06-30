import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface PlaysByCountryProps {
    data: Array<{
        country: string
        plays: number
        percentage: number
    }>
}

export function PlaysByCountryChart({ data }: PlaysByCountryProps) {
    // Sortujemy dane malejąco i pokazujemy wszystkie kraje
    // Dla lepszej czytelności małych wartości używamy poziomego układu
    const sortedData = [...data].sort((a, b) => b.plays - a.plays)

    // Dynamiczna wysokość na podstawie liczby krajów
    const chartHeight = Math.max(350, sortedData.length * 40)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Odtworzenia według krajów</CardTitle>
                <CardDescription>Kraje, w których słuchasz muzyki</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        data={sortedData}
                        layout="horizontal"
                        margin={{ top: 5, right: 50, left: 80, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                        />
                        <XAxis
                            type="number"
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickFormatter={(value) => value.toLocaleString()}
                        />
                        <YAxis
                            dataKey="country"
                            type="category"
                            width={70}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            interval={0}
                        />
                        <Tooltip
                            formatter={(value: any, _name: string, props: any) => [
                                `${value.toLocaleString()} odtworzeń (${props.payload.percentage.toFixed(1)}%)`,
                                'Odtworzenia'
                            ]}
                            labelFormatter={(label) => `Kraj: ${label}`}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                                color: 'hsl(var(--popover-foreground))',
                                fontSize: '14px',
                                padding: '8px 12px'
                            }}
                        />
                        <Bar
                            dataKey="plays"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
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
