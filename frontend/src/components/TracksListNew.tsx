import { useState } from 'react'
import { ChevronUp, ChevronDown, Play, TrendingUp, Settings2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from '../context/LanguageContext'

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
    labelKey: string // klucz do globalnego systemu tłumaczeń
    sortable: boolean
    format?: (value: any) => string
}

const availableColumns: ColumnConfig[] = [
    { key: 'trackName', labelKey: 'trackName', sortable: true },
    { key: 'artistName', labelKey: 'artistName', sortable: true },
    { key: 'albumName', labelKey: 'albumName', sortable: true },
    { key: 'totalPlays', labelKey: 'totalPlays', sortable: true },
    { key: 'totalMinutes', labelKey: 'totalMinutes', sortable: true },
    { key: 'avgPlayDuration', labelKey: 'avgPlayDuration', sortable: true, format: (val) => `${Math.floor(val / 60)}:${Math.floor(val % 60).toString().padStart(2, '0')}` },
    { key: 'skipPercentage', labelKey: 'skipPercentage', sortable: true, format: (val) => `${val.toFixed(1)}%` },
    { key: 'duration', labelKey: 'duration', sortable: true, format: (val) => val ? `${Math.floor(val / 60000)}:${Math.floor((val % 60000) / 1000).toString().padStart(2, '0')}` : 'N/A' },
    { key: 'firstPlay', labelKey: 'firstPlay', sortable: true, format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: 'lastPlay', labelKey: 'lastPlay', sortable: true, format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' },
    { key: 'platforms', labelKey: 'platforms', sortable: false, format: (val) => val ? val.join(', ') : 'N/A' },
    { key: 'countries', labelKey: 'countries', sortable: false, format: (val) => val ? val.join(', ') : 'N/A' },
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
    const { language, t } = useLanguage()

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
                        <p className="mt-2 text-muted-foreground">{t('loading')}</p>
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
                            <span>{t('tracks')}</span>
                            {pagination && (
                                <span className="text-sm text-muted-foreground">
                                    ({pagination.total.toLocaleString()} {t('tracksCount')})
                                </span>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {t('clickHeaders')}
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">{/* Kontrolki bez wyboru języka */}

                        {/* Wybór kolumn */}
                        <Button
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            className="px-3 py-1 text-xs"
                        >
                            <Settings2 className="h-4 w-4 mr-1" />
                            {t('columns')}
                        </Button>
                    </div>
                </div>

                {/* Selektor kolumn */}
                {showColumnSelector && (
                    <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                        <h4 className="text-sm font-medium mb-2">{t('selectColumns')}</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {availableColumns.map(column => (
                                <label key={column.key} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(column.key)}
                                        onChange={() => toggleColumnVisibility(column.key)}
                                        className="rounded"
                                    />
                                    <span>{t(column.labelKey)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {tracks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">{t('noTracks')}</p>
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
                                                        >                                            <span>{t(config.labelKey)}</span>
                                            {getSortIcon(columnKey)}
                                                        </button>
                                                    ) : (
                                                        <span className="font-semibold">{t(config.labelKey)}</span>
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
                                                                {t('timelineTitle')}: {track.trackName}
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
                                                                    {t('noTimelineData')}
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
                                    {t('page')} {pagination.page} {t('of')} {pagination.pages}
                                    ({pagination.total.toLocaleString()} {t('tracksCount')})
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                        onClick={() => onPageChange?.(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                    >
                                        {t('previous')}
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
                                        {t('next')}
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
