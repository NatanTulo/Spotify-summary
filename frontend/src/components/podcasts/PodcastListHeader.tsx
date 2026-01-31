import { Filter, SortAsc, SortDesc } from 'lucide-react'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '../../context/LanguageContext'
import { SortKey, SortOrder } from '../../hooks/usePodcastShows'

interface PodcastListHeaderProps {
    search: string
    setSearch: (s: string) => void
    onSearch: () => void
    order: SortOrder
    onToggleOrder: () => void
    sortBy: SortKey
    onSortChange: (k: SortKey) => void
    limit: number
    setLimit: (l: number) => void
}

export function PodcastListHeader({ 
    search, setSearch, onSearch, 
    order, onToggleOrder, 
    sortBy, onSortChange, 
    limit, setLimit 
}: PodcastListHeaderProps) {
    const { t } = useLanguage()

    return (
        <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <CardTitle>{t('shows') || 'Shows'}</CardTitle>
                    <CardDescription>{t('clickToExpand') || 'Click a show to see played episodes'}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
                            placeholder={t('search') || 'Search shows'}
                            className="border border-border bg-background text-foreground placeholder:text-muted-foreground rounded px-3 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <Button onClick={onSearch} variant="secondary" className="px-3 py-1 text-xs text-foreground" title={t('filter') || 'Filter'}>
                        <Filter className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onToggleOrder}
                        variant="secondary"
                        className="px-3 py-1 text-xs text-foreground"
                        title={t('toggleSortOrder') || 'Toggle sort order'}
                    >
                        {order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as SortKey)}
                        className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                        title={t('sortBy') || 'Sort by'}
                    >
                        <option value="plays">{t('totalPlays') || 'Plays'}</option>
                        <option value="time">{t('totalMinutes') || 'Time'}</option>
                        <option value="lastPlayed">{t('lastPlayed') || 'Last played'}</option>
                        <option value="name">{t('name') || 'Name'}</option>
                    </select>
                    <select
                        value={String(limit)}
                        onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                        className="border border-border bg-background text-foreground rounded px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                        title={t('pageSize') || 'Page size'}
                    >
                        {[25, 50, 100].map(sz => (
                            <option key={sz} value={sz}>{sz}/{t('page') || 'Page'}</option>
                        ))}
                    </select>
                </div>
            </div>
        </CardHeader>
    )
}
