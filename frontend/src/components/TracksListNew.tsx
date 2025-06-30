import { useState } from 'react'
import { ChevronUp, ChevronDown, Play, TrendingUp, Settings2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Tłumaczenia
const translations = {
    pl: {
        tracks: 'Lista utworów',
        clickHeaders: 'Kliknij nagłówki kolumn aby sortować według różnych kryteriów.',
        noTracks: 'Nie znaleziono utworów spełniających kryteria',
        loading: 'Ładowanie utworów...',
        track: 'Utwór',
        artist: 'Artysta',
        album: 'Album',
        plays: 'Odtworzenia',
        minutes: 'Minuty',
        avgDuration: 'Śr. długość',
        skipPercentage: '% pominiętych',
        timelineTitle: 'Historia odtworzeń',
        noTimelineData: 'Brak danych timeline dla tego utworu',
        page: 'Strona',
        of: 'z',
        tracksCount: 'utworów',
        previous: 'Poprzednia',
        next: 'Następna',
        columns: 'Kolumny',
        selectColumns: 'Wybierz kolumny do wyświetlenia'
    },
    en: {
        tracks: 'Tracks List',
        clickHeaders: 'Click column headers to sort by different criteria.',
        noTracks: 'No tracks found matching the criteria',
        loading: 'Loading tracks...',
        track: 'Track',
        artist: 'Artist',
        album: 'Album',
        plays: 'Plays',
        minutes: 'Minutes',
        avgDuration: 'Avg. Duration',
        skipPercentage: '% Skipped',
        timelineTitle: 'Play History',
        noTimelineData: 'No timeline data for this track',
        page: 'Page',
        of: 'of',
        tracksCount: 'tracks',
        previous: 'Previous',
        next: 'Next',
        columns: 'Columns',
        selectColumns: 'Select columns to display'
    }
}

// Rozszerzony interface dla utworu z wszystkimi dostępnymi danymi
interface ExtendedTrack {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
    // Dodatkowe pola z dokumentacji Spotify
    uri?: string
    duration?: number
    platforms?: string[]
    countries?: string[]
    firstPlay?: Date
    lastPlay?: Date
    username?: string
    reasonStart?: string[]
    reasonEnd?: string[]
    shuffle?: boolean | null
    offline?: boolean | null
    incognitoMode?: boolean | null
}

// Dostępne kolumny
interface ColumnConfig {
    key: keyof ExtendedTrack
    label: { pl: string; en: string }
    sortable: boolean
    format?: (value: any) => string
}

const availableColumns: ColumnConfig[] = [
    { key: 'trackName', label: { pl: 'Utwór', en: 'Track' }, sortable: true },
    { key: 'artistName', label: { pl: 'Artysta', en: 'Artist' }, sortable: true },
    { key: 'albumName', label: { pl: 'Album', en: 'Album' }, sortable: true },
    { key: 'totalPlays', label: { pl: 'Odtworzenia', en: 'Plays' }, sortable: true },
    { key: 'totalMinutes', label: { pl: 'Minuty', en: 'Minutes' }, sortable: true },
    { key: 'avgPlayDuration', label: { pl: 'Śr. długość', en: 'Avg. Duration' }, sortable: true, format: (val) => `${Math.floor(val / 60)}:${Math.floor(val % 60).toString().padStart(2, '0')}` },
    { key: 'skipPercentage', label: { pl: '% pominiętych', en: '% Skipped' }, sortable: true, format: (val) => `${val.toFixed(1)}%` },
    { key: 'duration', label: { pl: 'Długość utworu', en: 'Track Duration' }, sortable: true, format: (val) => val ? `${Math.floor(val / 60000)}:${Math.floor((val % 60000) / 1000).toString().padStart(2, '0')}` : 'N/A' },
    { key: 'firstPlay', label: { pl: 'Pierwsze odtworzenie', en: 'First Play' }, sortable: true, format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: 'lastPlay', label: { pl: 'Ostatnie odtworzenie', en: 'Last Play' }, sortable: true, format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: 'platforms', label: { pl: 'Platformy', en: 'Platforms' }, sortable: false, format: (val) => val ? val.join(', ') : 'N/A' },
    { key: 'countries', label: { pl: 'Kraje', en: 'Countries' }, sortable: false, format: (val) => val ? val.join(', ') : 'N/A' },
]

interface TracksListProps {
    tracks: ExtendedTrack[]
    loading?: boolean
    profileId?: string
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
    profileId,
    pagination,
    onPageChange,
    onSort,
    currentSort
}: TracksListProps) {
    const [language, setLanguage] = useState<'pl' | 'en'>('pl')
    const t = translations[language]

    const [expandedTrack, setExpandedTrack] = useState<string | null>(null)
    const [trackTimelineData, setTrackTimelineData] = useState<any[]>([])
    const [visibleColumns, setVisibleColumns] = useState<(keyof ExtendedTrack)[]>([
        'trackName', 'artistName', 'albumName', 'totalPlays', 'totalMinutes', 'avgPlayDuration', 'skipPercentage'
    ])
    const [showColumnSelector, setShowColumnSelector] = useState(false)

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
            const params = new URLSearchParams()
            if (profileId) {
                params.append('profileId', profileId)
            }

            const response = await fetch(`/api/tracks/${trackId}/timeline?${params}`)
            if (response.ok) {
                const data = await response.json()
                console.log('Timeline data:', data)
                setTrackTimelineData(data.data || [])
            } else {
                console.error('Timeline response not ok:', response.status, response.statusText)
                setTrackTimelineData([])
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

    const toggleColumnVisibility = (columnKey: keyof ExtendedTrack) => {
        setVisibleColumns(prev =>
            prev.includes(columnKey)
                ? prev.filter(k => k !== columnKey)
                : [...prev, columnKey]
        )
    }

    const getColumnConfig = (key: keyof ExtendedTrack) => {
        return availableColumns.find(col => col.key === key)
    }

    const formatCellValue = (track: ExtendedTrack, columnKey: keyof ExtendedTrack) => {
        const config = getColumnConfig(columnKey)
        const value = track[columnKey]

        if (config?.format && value !== undefined && value !== null) {
            return config.format(value)
        }

        if (typeof value === 'number') {
            return value.toLocaleString()
        }

        return value?.toString() || 'N/A'
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-muted-foreground">{t.loading}</p>
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
                            <span>{t.tracks}</span>
                            {pagination && (
                                <span className="text-sm text-muted-foreground">
                                    ({pagination.total.toLocaleString()} {t.tracksCount})
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {t.clickHeaders}
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Wybór języka */}
                        <Button
                            onClick={() => setLanguage(language === 'pl' ? 'en' : 'pl')}
                            className="px-3 py-1 text-xs"
                        >
                            {language === 'pl' ? 'EN' : 'PL'}
                        </Button>

                        {/* Wybór kolumn */}
                        <Button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="px-3 py-1 text-xs"
                        >
                            <Settings2 className="h-4 w-4 mr-1" />
                            {t.columns}
                        </Button>
                    </div>
                </div>

                {/* Selektor kolumn */}
                {showColumnSelector && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="text-sm font-medium mb-2">{t.selectColumns}</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {availableColumns.map(column => (
                                <label key={column.key} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(column.key)}
                                        onChange={() => toggleColumnVisibility(column.key)}
                                        className="rounded"
                                    />
                                    <span>{column.label[language]}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {tracks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">{t.noTracks}</p>
                    </div>
                ) : (
                    <>
                        {/* Tabela */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        {visibleColumns.map(columnKey => {
                                            const config = getColumnConfig(columnKey)
                                            if (!config) return null

                                            return (
                                                <th key={columnKey} className="text-left p-2">
                                                    {config.sortable ? (
                                                        <button
                                                            className="flex items-center space-x-1 font-semibold hover:bg-transparent"
                                                            onClick={() => handleSort(columnKey)}
                                                        >
                                                            <span>{config.label[language]}</span>
                                                            {getSortIcon(columnKey)}
                                                        </button>
                                                    ) : (
                                                        <span className="font-semibold">{config.label[language]}</span>
                                                    )}
                                                </th>
                                            )
                                        })}
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
                                                {visibleColumns.map(columnKey => (
                                                    <td key={columnKey} className="p-2">
                                                        {columnKey === 'trackName' ? (
                                                            <div className="flex items-center gap-2">
                                                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                                <div className="font-medium">{track.trackName}</div>
                                                            </div>
                                                        ) : columnKey === 'skipPercentage' ? (
                                                            <span className={`font-mono ${track.skipPercentage > 50 ? 'text-red-500' :
                                                                    track.skipPercentage > 20 ? 'text-yellow-500' :
                                                                        'text-green-500'
                                                                }`}>
                                                                {formatCellValue(track, columnKey)}
                                                            </span>
                                                        ) : (
                                                            <span className={columnKey === 'totalPlays' || columnKey === 'totalMinutes' || columnKey === 'avgPlayDuration' ? 'font-mono' : ''}>
                                                                {formatCellValue(track, columnKey)}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                            {expandedTrack === track.trackId && (
                                                <tr key={`${track.trackId}-expanded`}>
                                                    <td colSpan={visibleColumns.length} className="p-4 bg-muted/30">
                                                        <div className="space-y-4">
                                                            <h4 className="font-semibold text-sm">
                                                                {t.timelineTitle}: {track.trackName}
                                                            </h4>
                                                            <div className="h-64">
                                                                <ResponsiveContainer width="100%" height="100%">
                                                                    <BarChart data={trackTimelineData}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis
                                                                            dataKey="date"
                                                                            fontSize={12}
                                                                            type="category"
                                                                        />
                                                                        <YAxis fontSize={12} />
                                                                        <Tooltip
                                                                            labelFormatter={(value) => `${language === 'pl' ? 'Data' : 'Date'}: ${value}`}
                                                                            formatter={(value: any) => [value, language === 'pl' ? 'Odtworzenia' : 'Plays']}
                                                                        />
                                                                        <Bar
                                                                            dataKey="plays"
                                                                            fill="hsl(var(--primary))"
                                                                        />
                                                                    </BarChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                            {trackTimelineData.length === 0 && (
                                                                <div className="text-center text-muted-foreground py-8">
                                                                    {t.noTimelineData}
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
                                    {t.page} {pagination.page} {t.of} {pagination.pages}
                                    ({pagination.total.toLocaleString()} {t.tracksCount})
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => onPageChange?.(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        {t.previous}
                                    </button>

                                    {/* Numeracja stron */}
                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        const page = Math.max(1, pagination.page - 2) + i
                                        if (page > pagination.pages) return null

                                        return (
                                            <button
                                                key={page}
                                                className={`px-3 py-1 text-sm border rounded ${page === pagination.page ? 'bg-primary text-primary-foreground' : ''
                                                    }`}
                                                onClick={() => onPageChange?.(page)}
                                            >
                                                {page}
                                            </button>
                                        )
                                    })}

                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => onPageChange?.(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.pages}
                                    >
                                        {t.next}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
