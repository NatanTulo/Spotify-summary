import { Suspense, lazy, useEffect } from 'react'
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
        pagination,
        filters,
        setFilters,
        fetchAlbums,
        handlePageChange,
        handlePageSizeChange,
        handleSort
    } = useAlbumsData(selectedProfile)

    const { metadata } = useFilterMetadata(selectedProfile)

    useEffect(() => {
        fetchAlbums()
    }, [fetchAlbums])

    return (
        <div className="space-y-6">
             <AdvancedFilters
                filters={filters}
                onFiltersChange={setFilters}
                onApply={() => fetchAlbums(1)}
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
                    fetchAlbums(1)
                }}
                countries={metadata.countries}
                platforms={metadata.platforms}
            />
            <Suspense fallback={<ChartLoader />}>
                <AlbumsList
                    albums={albums}
                    loading={loading}
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
