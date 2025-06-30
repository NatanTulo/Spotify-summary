import { useState } from 'react'
import { ChevronUp, ChevronDown, Play, Clock, BarChart3, Percent, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataLegend } from './DataLegendSimple'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Track {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
}

interface TracksListProps {
    tracks: Track[]
    loading?: boolean
    pagination?: {
        page: number
        limit: number
        total: number
        pages: number
    }
    onPageChange?: (page: number) => void
    onSort?: (field: string, order: 'asc' | 'desc') => void
    currentSort?: {
        field: string
        order: 'asc' | 'desc'
    }
}

export function TracksList({
    tracks,
    loading = false,
    pagination,
    onPageChange,
    onSort,
    currentSort
}: TracksListProps) {
    const [expandedTrack, setExpandedTrack] = useState<string | null>(null)
    const [trackTimelineData, setTrackTimelineData] = useState<any[]>([])

    const handleSort = (field: string) => {
        if (!onSort) return

        const newOrder = currentSort?.field === field && currentSort.order === 'desc' ? 'asc' : 'desc'
        onSort(field, newOrder)
    }

    const toggleTrackExpansion = async (trackId: string) => {
        if (expandedTrack === trackId) {
            setExpandedTrack(null)
            return
        }

        setExpandedTrack(trackId)

        // Fetch timeline data for track
        try {
            const response = await fetch(`/api/tracks/${trackId}/timeline`)
            if (response.ok) {
                const data = await response.json()
                setTrackTimelineData(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching track timeline:', error)
            setTrackTimelineData([])
        }
    }

    const getSortIcon = (field: string) => {
        if (currentSort?.field !== field) return null
        return currentSort.order === 'desc' ?
            <ChevronDown className="h-4 w-4" /> :
            <ChevronUp className="h-4 w-4" />
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">Ładowanie utworów...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center space-x-2">
                            <Play className="h-5 w-5" />
                            <span>Lista utworów</span>
                            {pagination && (
                                <span className="text-sm text-muted-foreground">
                                    ({pagination.total.toLocaleString()} utworów)
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Kliknij nagłówki kolumn aby sortować według różnych kryteriów.
                        </CardDescription>
                    </div>
                    <DataLegend />
                </div>
            </CardHeader>
            <CardContent>
                {tracks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Nie znaleziono utworów spełniających kryteria</p>
                    </div>
                ) : (
                    <>
                        {/* Tabela */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('trackName')}
                                            >
                                                Utwór {getSortIcon('trackName')}
                                            </Button>
                                        </th>
                                        <th className="text-left p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('artistName')}
                                            >
                                                Artysta {getSortIcon('artistName')}
                                            </Button>
                                        </th>
                                        <th className="text-left p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('albumName')}
                                            >
                                                Album {getSortIcon('albumName')}
                                            </Button>
                                        </th>
                                        <th className="text-right p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('totalPlays')}
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Odtworzenia {getSortIcon('totalPlays')}
                                            </Button>
                                        </th>
                                        <th className="text-right p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('totalMinutes')}
                                            >
                                                <Clock className="h-4 w-4 mr-1" />
                                                Minuty {getSortIcon('totalMinutes')}
                                            </Button>
                                        </th>
                                        <th className="text-right p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('avgPlayDuration')}
                                            >
                                                <BarChart3 className="h-4 w-4 mr-1" />
                                                Śr. długość {getSortIcon('avgPlayDuration')}
                                            </Button>
                                        </th>
                                        <th className="text-right p-2">
                                            <Button
                                                variant="ghost"
                                                className="h-auto p-0 font-semibold hover:bg-transparent"
                                                onClick={() => handleSort('skipPercentage')}
                                            >
                                                <Percent className="h-4 w-4 mr-1" />
                                                % pominiętych {getSortIcon('skipPercentage')}
                                            </Button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tracks.map((track) => (
                                        <>
                                            <tr
                                                key={track.trackId}
                                                className="border-b hover:bg-muted/50 cursor-pointer"
                                                onClick={() => toggleTrackExpansion(track.trackId)}
                                            >
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                        <div className="font-medium">{track.trackName}</div>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-muted-foreground">
                                                    {track.artistName}
                                                </td>
                                                <td className="p-2 text-muted-foreground">
                                                    {track.albumName}
                                                </td>
                                                <td className="p-2 text-right font-mono">
                                                    {track.totalPlays.toLocaleString()}
                                                </td>
                                                <td className="p-2 text-right font-mono">
                                                    {track.totalMinutes.toLocaleString()}
                                                </td>
                                                <td className="p-2 text-right font-mono">
                                                    {formatDuration(track.avgPlayDuration)}
                                                </td>
                                                <td className="p-2 text-right font-mono">
                                                    <span className={`${track.skipPercentage > 50 ? 'text-red-500' :
                                                        track.skipPercentage > 20 ? 'text-yellow-500' :
                                                            'text-green-500'
                                                        }`}>
                                                        {track.skipPercentage.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                            {expandedTrack === track.trackId && (
                                                <tr key={`${track.trackId}-expanded`}>
                                                    <td colSpan={7} className="p-4 bg-muted/30">
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-sm">
                                                                Historia odtworzeń: {track.trackName}
                                                            </h4>
                                                            <div className="h-64">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <LineChart data={trackTimelineData}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis
                                                                            dataKey="date"
                                                                            fontSize={12}
                                                                        />
                                                                        <YAxis fontSize={12} />
                                                                        <Tooltip
                                                                            labelFormatter={(value) => `Data: ${value}`}
                                                                            formatter={(value: any) => [value, 'Odtworzenia']}
                                                                        />
                                                                        <Line
                                                                            type="monotone"
                                                                            dataKey="plays"
                                                                            stroke="hsl(var(--primary))"
                                                                            strokeWidth={2}
                                                                            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                                                                        />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                            {trackTimelineData.length === 0 && (
                                                                <div className="text-center text-muted-foreground py-8">
                                                                    Brak danych timeline dla tego utworu
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginacja */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Strona {pagination.page} z {pagination.pages}
                                    ({pagination.total.toLocaleString()} utworów)
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPageChange?.(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        Poprzednia
                                    </Button>

                                    {/* Numeracja stron */}
                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        const page = Math.max(1, pagination.page - 2) + i
                                        if (page > pagination.pages) return null

                                        return (
                                            <Button
                                                key={page}
                                                variant={page === pagination.page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => onPageChange?.(page)}
                                            >
                                                {page}
                                            </Button>
                                        )
                                    })}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPageChange?.(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages}
                                    >
                                        Następna
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
