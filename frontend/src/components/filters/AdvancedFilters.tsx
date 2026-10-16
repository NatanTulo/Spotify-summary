import { Select } from '@/components/ui/Select'
import { useState, type ReactNode } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import type { FilterState } from '@/pages/music/types'
interface AdvancedFiltersProps {
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    onApply?: () => void
    onReset: () => void
    countries?: string[]
    platforms?: string[]
    contentType?: 'tracks' | 'albums'
    children?: ReactNode
}
export function AdvancedFilters({ filters, onFiltersChange, onReset, countries = [], platforms = [], contentType = 'tracks', children }: AdvancedFiltersProps) {
    const [expanded, setExpanded] = useState(false)
    const { t } = useLanguage()
    const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => onFiltersChange({ ...filters, [key]: value })
    const count = [filters.minPlays > 0, !!filters.country, !!filters.platform, filters.showSkipped, filters.showShuffle].filter(Boolean).length
    const field = 'h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground'
    return <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-44 flex-1">
                <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input type="search" className={`${field} pl-9`} placeholder={t('searchPlaceholder')} aria-label={t('search')} value={filters.search} onChange={e => update('search', e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={`filters-${contentType}`}><Filter className="mr-2 h-4 w-4" />{t('filters')}{count > 0 && <span className="ml-2 rounded bg-accent px-1.5 text-accent-foreground">{count}</span>}</Button>
            {(count > 0 || filters.search) && <Button variant="ghost" size="icon" onClick={onReset} aria-label={t('resetFilters')}><X className="h-4 w-4" /></Button>}
            {children}
        </div>
        {expanded && <div id={`filters-${contentType}`} className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-3 lg:grid-cols-5">
            <label className="space-y-1 text-sm">{t('minPlays')}<input type="number" min="0" className={field} value={filters.minPlays} onChange={e => update('minPlays', Math.max(0, Number(e.target.value) || 0))} /></label>
            <label className="space-y-1 text-sm">{t('country')}<Select className={field} value={filters.country} onValueChange={value => update('country', value)}><option value="">{t('allCountries')}</option>{countries.map(v => <option key={v}>{v}</option>)}</Select></label>
            <label className="space-y-1 text-sm">{t('platform')}<Select className={field} value={filters.platform} onValueChange={value => update('platform', value)}><option value="">{t('allPlatforms')}</option>{platforms.map(v => <option key={v}>{v}</option>)}</Select></label>
            <label className="space-y-1 text-sm">{t('sortBy')}<Select className={field} value={filters.sortBy} onValueChange={value => update('sortBy', value)}>{(contentType === 'albums' ? [['plays','totalPlays'],['minutes','totalMinutes'],['name','album'],['artist','artistName']] : [['totalPlays','totalPlays'],['totalMinutes','totalMinutes'],['trackName','trackName'],['artistName','artistName'],['lastPlay','lastPlay'],['avgPlayDuration','avgPlayDuration'],['skipPercentage','skipPercentage']]).map(([v,k]) => <option key={v} value={v}>{t(k)}</option>)}</Select></label>
            <label className="space-y-1 text-sm">{t('sortOrder')}<Select className={field} value={filters.sortOrder} onValueChange={value => update('sortOrder', value as 'asc' | 'desc')}><option value="desc">{t('descending')}</option><option value="asc">{t('ascending')}</option></Select></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.showSkipped} onChange={e => update('showSkipped', e.target.checked)} />{t('showSkipped')}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.showShuffle} onChange={e => update('showShuffle', e.target.checked)} />{t('showShuffle')}</label>
        </div>}
    </div>
}
