import { useState } from 'react'
import { Search, Filter, X, Calendar, Globe, Music, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
                        <span>Filtry i wyszukiwanie</span>
                        {hasActiveFilters() && (
                            <span className="bg-spotify-green text-white text-xs px-2 py-1 rounded-full">
                                Aktywne
                            </span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Zwiń' : 'Rozwiń'}
                    </Button>
                </CardTitle>
                <CardDescription>
                    Filtruj i sortuj utwory według różnych kryteriów
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Podstawowe wyszukiwanie */}
                <div className="flex space-x-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Szukaj utworów, artystów, albumów..."
                            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                            value={filters.search}
                            onChange={(e) => updateFilter('search', e.target.value)}
                        />
                    </div>
                    <Button onClick={onApply} className="flex items-center space-x-2">
                        <Search className="h-4 w-4" />
                        <span>Szukaj</span>
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
                                    Min. liczba odtworzeń
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
                                    Kraj
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.country}
                                    onChange={(e) => updateFilter('country', e.target.value)}
                                >
                                    <option value="">Wszystkie kraje</option>
                                    {countries.map(country => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Users className="inline h-4 w-4 mr-1" />
                                    Platforma
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.platform}
                                    onChange={(e) => updateFilter('platform', e.target.value)}
                                >
                                    <option value="">Wszystkie platformy</option>
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
                                    Data od
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
                                    Data do
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
                                <label className="block text-sm font-medium mb-2">Sortuj według</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.sortBy}
                                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                                >
                                    <option value="totalPlays">Liczba odtworzeń</option>
                                    <option value="totalMinutes">Czas słuchania</option>
                                    <option value="trackName">Nazwa utworu</option>
                                    <option value="artistName">Nazwa artysty</option>
                                    <option value="avgPlayDuration">Średni czas odtwarzania</option>
                                    <option value="skipPercentage">Procent pominiętych</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Kolejność</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    value={filters.sortOrder}
                                    onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                                >
                                    <option value="desc">Malejąco</option>
                                    <option value="asc">Rosnąco</option>
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
                                <span className="text-sm">Tylko pominięte utwory</span>
                            </label>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={filters.showShuffle}
                                    onChange={(e) => updateFilter('showShuffle', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm">Tylko z shuffle</span>
                            </label>
                        </div>

                        {/* Przyciski akcji */}
                        <div className="flex space-x-2 pt-4">
                            <Button onClick={onApply} className="flex items-center space-x-2">
                                <Filter className="h-4 w-4" />
                                <span>Zastosuj filtry</span>
                            </Button>

                            {hasActiveFilters() && (
                                <Button variant="outline" onClick={onReset} className="flex items-center space-x-2">
                                    <X className="h-4 w-4" />
                                    <span>Wyczyść filtry</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
