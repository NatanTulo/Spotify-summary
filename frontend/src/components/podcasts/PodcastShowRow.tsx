import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { SortKey, SortOrder } from '../../hooks/usePodcastShows'

interface EpisodeRow {
    id: number
    name: string
    playCount: number
    totalTime: number
    lastPlayed?: string | null
    spotifyUri?: string | null
}

interface PodcastShowRowProps {
    show: {
        id: number
        name: string
        playCount: number
        totalTime: number
        lastPlayed?: string | null
    }
    selectedProfile: string | null
    onEpisodeSelect: (episode: { id: number; name: string; showName: string }) => void
}

const DEFAULT_ORDER: Record<SortKey, SortOrder> = {
    plays: 'desc',
    time: 'desc',
    lastPlayed: 'desc',
    name: 'desc'
}

export function PodcastShowRow({ show, selectedProfile, onEpisodeSelect }: PodcastShowRowProps) {
    const { t } = useLanguage()
    const [expanded, setExpanded] = useState(false)
    const [episodes, setEpisodes] = useState<EpisodeRow[]>([])
    const [loadingEpisodes, setLoadingEpisodes] = useState(false)
    const [episodeSort, setEpisodeSort] = useState<{ sortBy: SortKey; order: SortOrder }>({ sortBy: 'plays', order: 'desc' })

    const fetchEpisodes = async (s: SortKey, o: SortOrder) => {
        setLoadingEpisodes(true)
        try {
            const params = new URLSearchParams({
                limit: '500',
                sortBy: s,
                order: o,
                profileId: selectedProfile || 'all',
            })
            const res = await fetch(`/api/podcasts/shows/${show.id}/episodes?${params.toString()}`)
            const json = await res.json()
            if (json.success) {
                setEpisodes(json.data.episodes)
            }
        } finally {
            setLoadingEpisodes(false)
        }
    }

    const toggleExpand = () => {
        const nextState = !expanded
        setExpanded(nextState)
        if (nextState && episodes.length === 0) {
            fetchEpisodes(episodeSort.sortBy, episodeSort.order)
        }
    }

    const handleSort = (column: 'plays' | 'time' | 'lastPlayed') => {
        let nextOrder: SortOrder
        if (episodeSort.sortBy === column) {
            nextOrder = episodeSort.order === 'asc' ? 'desc' : 'asc'
        } else {
            nextOrder = DEFAULT_ORDER[column]
        }
        
        const nextSort = { sortBy: column as SortKey, order: nextOrder }
        setEpisodeSort(nextSort)
        fetchEpisodes(nextSort.sortBy, nextSort.order)
    }

    const formatMs = (ms: number) => {
        const m = Math.floor((ms || 0) / 60000)
        const h = Math.floor(m / 60)
        return h > 0 ? `${h}h ${m % 60}m` : `${m}m`
    }

    return (
        <div className="py-3 border-b last:border-0">
            <button
                onClick={toggleExpand}
                className="w-full flex items-center justify-between hover:bg-muted/50 rounded px-2 py-1"
            >
                <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium text-left">{show.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{show.playCount.toLocaleString()} {t('plays') || 'plays'}</span>
                    <span>{formatMs(show.totalTime)}</span>
                    {show.lastPlayed && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(show.lastPlayed).toLocaleDateString()}</span>
                    )}
                </div>
            </button>

            {expanded && (
                <div className="mt-2 ml-6 border-l pl-4">
                    {loadingEpisodes ? (
                        <div className="text-sm text-muted-foreground py-2">{t('loading') || 'Loading...'}</div>
                    ) : episodes.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">{t('noEpisodes') || 'No played episodes'}</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-muted-foreground select-none">
                                    <th className="text-left py-1 pr-2 font-medium">{t('episode') || 'Episode'}</th>
                                    {(['plays', 'time', 'lastPlayed'] as const).map(col => {
                                        const active = episodeSort.sortBy === col
                                        const label = col === 'plays' ? (t('totalPlays') || 'Plays') : col === 'time' ? (t('totalMinutes') || 'Time') : (t('lastPlayed') || 'Last played')
                                        return (
                                            <th
                                                key={col}
                                                onClick={() => handleSort(col)}
                                                className="text-right py-1 pr-2 cursor-pointer hover:text-foreground transition-colors group"
                                                title={t('toggleSortOrder') || 'Toggle sort order'}
                                            >
                                                <span className={active ? 'text-foreground font-semibold inline-flex items-center gap-1' : 'inline-flex items-center gap-1'}>
                                                    {label}
                                                    {active && (
                                                        <span className="text-xs opacity-70">{(episodeSort.order === 'asc') ? '▲' : '▼'}</span>
                                                    )}
                                                </span>
                                            </th>
                                        )
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {episodes.map(ep => (
                                    <tr key={ep.id} className="border-t">
                                        <td className="py-1 pr-2">
                                            <button
                                                onClick={() => onEpisodeSelect({ id: ep.id, name: ep.name, showName: show.name })}
                                                className="text-left hover:underline text-blue-600 dark:text-blue-400"
                                            >
                                                {ep.name}
                                            </button>
                                        </td>
                                        <td className="text-right py-1 pr-2">{ep.playCount.toLocaleString()}</td>
                                        <td className="text-right py-1 pr-2">{formatMs(ep.totalTime)}</td>
                                        <td className="text-right py-1">{ep.lastPlayed ? new Date(ep.lastPlayed).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    )
}
