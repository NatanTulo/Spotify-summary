import React, { useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { useProfile } from '../../context/ProfileContext'
import { useLanguage } from '../../context/LanguageContext'
import EpisodeDetails from './EpisodeDetails'
import { usePodcastShows } from '../../hooks/usePodcastShows'
import { PodcastListHeader } from './PodcastListHeader'
import { PodcastShowRow } from './PodcastShowRow'

export const PodcastsShowsList: React.FC = () => {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    
    // Custom hook for managing shows list state
    const {
        shows,
        loading,
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
    if (selectedEpisode && selectedProfile) {
        return (
            <EpisodeDetails
                episodeId={selectedEpisode.id}
                episodeName={selectedEpisode.name}
                showName={selectedEpisode.showName}
                profileId={selectedProfile}
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
                    <div className="text-center text-muted-foreground py-8">{t('loading') || 'Loading...'}</div>
                ) : shows.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">{t('noData') || 'No data'}</div>
                ) : (
                    <div>
                        {shows.map(show => (
                            <PodcastShowRow 
                                key={show.id} 
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
