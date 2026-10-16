import { Select } from '@/components/ui/Select'
import { SortAsc, SortDesc } from 'lucide-react'
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
    search, setSearch,
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
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <input
                            aria-label={t('search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('search') || 'Search shows'}
                            className="border border-border bg-background text-foreground placeholder:text-muted-foreground rounded px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <Button
                        onClick={onToggleOrder}
                        variant="secondary"
                        className="px-3 py-1 text-xs text-foreground"
                        aria-label={t('toggleSortOrder')}
                        title={t('toggleSortOrder') || 'Toggle sort order'}
                    >
                        {order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                    <Select
                        value={sortBy}
                        onValueChange={(value) => onSortChange(value as SortKey)}
                        className="border border-border bg-background text-foreground rounded px-2 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                        aria-label={t('sortBy')}
                        title={t('sortBy') || 'Sort by'}
                    >
                        <option value="plays">{t('totalPlays') || 'Plays'}</option>
                        <option value="time">{t('totalMinutes') || 'Time'}</option>
                        <option value="lastPlayed">{t('lastPlayed') || 'Last played'}</option>
                        <option value="name">{t('name') || 'Name'}</option>
                    </Select>
                    <Select
                        value={String(limit)}
                        onValueChange={(value) => setLimit(parseInt(value, 10))}
                        className="border border-border bg-background text-foreground rounded px-2 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                        aria-label={t('pageSize')}
                        title={t('pageSize') || 'Page size'}
                    >
                        {[25, 50, 100].map(sz => (
                            <option key={sz} value={sz}>{sz}/{t('page') || 'Page'}</option>
                        ))}
                    </Select>
                </div>
            </div>
        </CardHeader>
    )
}
