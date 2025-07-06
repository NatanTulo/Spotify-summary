import { useState } from 'react'
import { Search, Filter, X, Calendar, Globe, Music, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/context/LanguageContext'

interface FilterState {
    search: string
    minPlays: number
    dateFrom: string
    dateTo: string
    country: string
    platform: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    showSkipped: boolean
    showShuffle: boolean
}

interface AdvancedFiltersProps {
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    onApply: () => void
    onReset: () => void
    countries?: string[]
    platforms?: string[]
}

export function AdvancedFilters({
    filters,
    onFiltersChange,
    onApply,
    onReset,
    countries = [],
    platforms = []
}: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const { t } = useLanguage()

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFiltersChange({ ...filters, [key]: value })
    }

    const hasActiveFilters = () => {
        return filters.search ||
            filters.minPlays > 0 ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.country ||
            filters.platform ||
            filters.showSkipped ||
            filters.showShuffle
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Filter className="h-5 w-5" />
                        <span>{t('filters')}</span>
                        {hasActiveFilters() && (
                            <span className="bg-spotify-green text-white text-xs px-2 py-1 rounded-full">
                                {t('activeFilters')}
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? t('close') : t('advancedFilters')}
                    </Button>
                </CardTitle>
                <CardDescription>
                    {t('clickHeaders')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Podstawowe wyszukiwanie */}
                <div className="flex space-x-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                        />
                    </div>
                    <Button onClick={onApply} className="flex items-center space-x-2">
                        <Search className="h-4 w-4" />
                        <span>{t('search')}</span>
                    </Button>
                </div>

                {/* Zaawansowane filtry */}
                {isExpanded && (
                    <div className="space-y-4 pt-4 border-t">
                        {/* Pierwsza linia filtrów */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Music className="inline h-4 w-4 mr-1" />
                                    {t('minPlays')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.minPlays}
                                    onChange={(e) => updateFilter('minPlays', parseInt(e.target.value) || 0)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Globe className="inline h-4 w-4 mr-1" />
                                    {t('country')}
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.country}
                                    onChange={(e) => updateFilter('country', e.target.value)}
                                >
                                    <option value="">{t('allCountries')}</option>
                                    {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Users className="inline h-4 w-4 mr-1" />
                                    {t('platform')}
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.platform}
                                    onChange={(e) => updateFilter('platform', e.target.value)}
                                >
                                    <option value="">{t('allPlatforms')}</option>
                                    {platforms.map(platform => (
                                        <option key={platform} value={platform}>{platform}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Druga linia filtrów */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Calendar className="inline h-4 w-4 mr-1" />
                                    {t('from')}
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.dateFrom}
                                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Calendar className="inline h-4 w-4 mr-1" />
                                    {t('to')}
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.dateTo}
                                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Sortowanie */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">{t('sortBy')}</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.sortBy}
                                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                                >
                                    <option value="totalPlays">{t('totalPlays')}</option>
                                    <option value="totalMinutes">{t('totalMinutes')}</option>
                                    <option value="trackName">{t('trackName')}</option>
                                    <option value="artistName">{t('artistName')}</option>
                                    <option value="avgPlayDuration">{t('avgPlayDuration')}</option>
                                    <option value="skipPercentage">{t('skipPercentage')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">{t('sortOrder')}</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.sortOrder}
                                    onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                                >
                                    <option value="desc">{t('descending')}</option>
                                    <option value="asc">{t('ascending')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Checkboxy */}
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={filters.showSkipped}
                                    onChange={(e) => updateFilter('showSkipped', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">{t('showSkipped')}</span>
                            </label>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={filters.showShuffle}
                                    onChange={(e) => updateFilter('showShuffle', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">{t('showShuffle')}</span>
                            </label>
                        </div>

                        {/* Przyciski akcji */}
                        <div className="flex space-x-2 pt-4">
                            <Button onClick={onApply} className="flex items-center space-x-2">
                                <Filter className="h-4 w-4" />
                                <span>{t('applyFilters')}</span>
                            </Button>

                            {hasActiveFilters() && (
                                <Button variant="outline" onClick={onReset} className="flex items-center space-x-2">
                                    <X className="h-4 w-4" />
                                    <span>{t('resetFilters')}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
