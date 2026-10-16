import type { ReactNode } from 'react'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { TracksList } from '@/components/TracksList'
import { FilterState, Track } from '../types'
interface TracksTabProps {
    tracks: Track[]; loading: boolean; error?: Error | null
    pagination: { page: number; limit: number; total: number; pages: number }
    filters: FilterState; selectedProfile: string | null
    availableCountries: string[]; availablePlatforms: string[]
    onFiltersChange: (filters: FilterState) => void
    onPageChange: (page: number) => void; onPageSizeChange: (limit: number) => void
    onSort: (field: string, order: 'asc' | 'desc') => void
    onApplyFilters: () => void; onResetFilters: () => void
}
export function TracksTab(props: TracksTabProps) {
    return <TracksList tracks={props.tracks} loading={props.loading} error={props.error} onRetry={props.onApplyFilters} profileId={props.selectedProfile || undefined} pagination={props.pagination} onPageChange={props.onPageChange} onPageSizeChange={props.onPageSizeChange} onSort={props.onSort} currentSort={{ field: props.filters.sortBy, order: props.filters.sortOrder }} toolbar={(controls: ReactNode) => <AdvancedFilters filters={props.filters} onFiltersChange={props.onFiltersChange} onReset={props.onResetFilters} countries={props.availableCountries} platforms={props.availablePlatforms}>{controls}</AdvancedFilters>} />
}
