import { Suspense, lazy } from 'react'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { FilterState, Track } from '../types'

const TracksList = lazy(() => import('@/components/TracksList').then(module => ({ default: module.TracksList })))

interface TracksTabProps {
    tracks: Track[]
    loading: boolean
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
    filters: FilterState
    selectedProfile: string | null
    availableCountries: string[]
    availablePlatforms: string[]
    onFiltersChange: (filters: any) => void
    onPageChange: (page: number) => void
    onPageSizeChange: (limit: number) => void
    onSort: (field: string, order: 'asc' | 'desc') => void
    onApplyFilters: () => void
    onResetFilters: () => void
}

const ChartLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
)

export function TracksTab({
    tracks,
    loading,
    pagination,
    filters,
    selectedProfile,
    availableCountries,
    availablePlatforms,
    onFiltersChange,
    onPageChange,
    onPageSizeChange,
    onSort,
    onApplyFilters,
    onResetFilters
}: TracksTabProps) {
    return (
        <div className="space-y-6">
            <AdvancedFilters
                filters={filters}
                onFiltersChange={onFiltersChange}
                onApply={onApplyFilters}
                onReset={onResetFilters}
                countries={availableCountries}
                platforms={availablePlatforms}
            />
            <Suspense fallback={<ChartLoader />}>
                <TracksList
                    tracks={tracks as any[]}
                    loading={loading}
                    profileId={selectedProfile || undefined}
                    pagination={pagination}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    onSort={onSort}
                    currentSort={{
                        field: filters.sortBy,
                        order: filters.sortOrder
                    }}
                />
            </Suspense>
        </div>
    )
}
