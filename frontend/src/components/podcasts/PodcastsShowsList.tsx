import React, { useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { useDateRange } from '../../context/DateRangeContext'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import EpisodeDetails from './EpisodeDetails'
import { usePodcastShows } from '../../hooks/usePodcastShows'
import { PodcastListHeader } from './PodcastListHeader'
import { PodcastShowRow } from './PodcastShowRow'

export const PodcastsShowsList: React.FC = () => {
    const { range } = useDateRange()
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()

    // Custom hook for managing shows list state
    const {
        shows,
        loading,
        error,
        fetchShows,
        search,
        setSearch,
        sortBy,
        handleSortChange,
        order,
        handleOrderToggle,
        limit,
        setLimit,
        offset,
        total,
        totalPages,
        currentPage,
        canPrev,
        canNext,
        handlePageChange,
        handleSearch
    } = usePodcastShows(selectedProfile)

    const [selectedEpisode, setSelectedEpisode] = useState<{ id: number; name: string; showName: string } | null>(null)

    // Show episode details if selected
    if (selectedEpisode) {
        return (
            <EpisodeDetails
                episodeId={selectedEpisode.id}
                episodeName={selectedEpisode.name}
                showName={selectedEpisode.showName}
                profileId={selectedProfile || 'all'}
                onBack={() => setSelectedEpisode(null)}
            />
        )
    }

    return (
        <Card>
            <PodcastListHeader
                search={search}
                setSearch={setSearch}
                onSearch={handleSearch}
                order={order}
                onToggleOrder={handleOrderToggle}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                limit={limit}
                setLimit={setLimit}
            />

            <CardContent>
                {loading ? (
                    <div role="status" className="text-center text-muted-foreground py-8">{t('loading') || 'Loading...'}</div>
                ) : error ? <div role="alert" className="space-y-3 py-8"><p>{t('error')}: {error.message}</p><Button variant="outline" onClick={() => void fetchShows()}>{t('refresh')}</Button></div> : shows.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">{t('noData') || 'No data'}</div>
                ) : (
                    <div>
                        {shows.map(show => (
                            <PodcastShowRow
                                key={`${selectedProfile}-${range.dateFrom}-${range.dateTo}-${show.id}`}
                                show={show}
                                selectedProfile={selectedProfile}
                                onEpisodeSelect={setSelectedEpisode}
                            />
                        ))}

                        <div className="flex items-center justify-between pt-3 mt-4 border-t">
                            <div className="text-sm text-foreground">
                                {t('page') || 'Page'} {currentPage} / {totalPages} • {t('total') || 'Total'} {total}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    disabled={!canPrev}
                                    onClick={() => handlePageChange(Math.max(0, offset - limit))}
                                >
                                    {t('prev') || 'Prev'}
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={!canNext}
                                    onClick={() => handlePageChange(offset + limit)}
                                >
                                    {t('next') || 'Next'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default PodcastsShowsList
