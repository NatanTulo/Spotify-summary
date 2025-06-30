import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#1DB954', '#191414', '#1ed760', '#1aa34a', '#169c46', '#137d3c']

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
                        <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Odtworzenia']} />
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
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip
                            formatter={(value: any, name: string) => [
                                name === 'plays' ? value.toLocaleString() : `${Math.round(value).toLocaleString()} min`,
                                name === 'plays' ? 'Odtworzenia' : 'Minuty'
                            ]}
                        />
                        <Bar yAxisId="left" dataKey="plays" fill="#1DB954" name="plays" />
                        <Bar yAxisId="right" dataKey="minutes" fill="#1aa34a" name="minutes" />
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
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Odtworzenia']} />
                        <Bar dataKey="plays" fill="#1DB954" />
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
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                            formatter={(value: any, name: string) => [
                                name === 'plays' ? value.toLocaleString() : `${Math.round(value).toLocaleString()} min`,
                                name === 'plays' ? 'Odtworzenia' : 'Minuty'
                            ]}
                        />
                        <Line type="monotone" dataKey="plays" stroke="#1DB954" strokeWidth={2} />
                        <Line type="monotone" dataKey="minutes" stroke="#1aa34a" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
