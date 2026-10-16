import { Suspense, lazy } from 'react'
import { AdvancedFilters } from '@/components/filters/AdvancedFilters'
import { useAlbumsData } from '../hooks/useAlbumsData'
import { useFilterMetadata } from '@/hooks/useFilterMetadata'

const AlbumsList = lazy(() => import('@/components/AlbumsList').then(module => ({ default: module.AlbumsList })))

interface AlbumsTabProps {
    selectedProfile: string | null
}

const ChartLoader = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
)

export function AlbumsTab({ selectedProfile }: AlbumsTabProps) {
    const {
        albums,
        loading,
        error,
        pagination,
        filters,
        setFilters,
        fetchAlbums,
        handlePageChange,
        handlePageSizeChange,
        handleSort
    } = useAlbumsData(selectedProfile)

    const { metadata } = useFilterMetadata(selectedProfile)

    return (
        <div className="space-y-3">
             <AdvancedFilters
                contentType="albums"
                filters={filters}
                onFiltersChange={setFilters}
                onApply={() => fetchAlbums()}
                onReset={() => {
                     setFilters({
                        search: '',
                        minPlays: 0,
                        dateFrom: '',
                        dateTo: '',
                        country: '',
                        platform: '',
                        sortBy: 'plays',
                        sortOrder: 'desc',
                        showSkipped: false,
                        showShuffle: false
                    })
                }}
                countries={metadata.countries}
                platforms={metadata.platforms}
            />
            <Suspense fallback={<ChartLoader />}>
                <AlbumsList
                    albums={albums}
                    loading={loading}
                    error={error}
                    onRetry={() => fetchAlbums()}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onSort={handleSort}
                    currentSort={{
                        field: filters.sortBy,
                        order: filters.sortOrder
                    }}
                />
            </Suspense>
        </div>
    )
}
