import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Users, Music, Clock, Globe, Radio } from 'lucide-react'
import { useProfile } from '../context/ProfileContext'
import { DataImportGuide } from '@/components/DataImportGuide'
import { useLanguage } from '../context/LanguageContext'
import { useDashboardStats } from '../hooks/useDashboardStats'

const Dashboard = () => {
    const { selectedProfile } = useProfile()
    const { t } = useLanguage()
    const {
        stats,
        podcastStats,
        topTracks,
        topArtists,
        topShows,
        topEpisodes
    } = useDashboardStats(selectedProfile)

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('dashboard')}</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                        {t('generalStatsDesc')}
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-3 sm:gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('totalPlaysCard')}</CardTitle>
                        <Play className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {stats.totalPlays > 0 ? stats.totalPlays.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalPlays > 0 ? t('playsLabel') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('listeningMinutes')}</CardTitle>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {stats.totalMinutes > 0 ? stats.totalMinutes.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalMinutes > 0 ? `≈ ${Math.round(stats.totalMinutes / 60)} ${t('approxHours')}` : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('uniqueTracksCard')}</CardTitle>
                        <Music className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {stats.uniqueTracks > 0 ? stats.uniqueTracks.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.uniqueTracks > 0 ? t('differentSongs') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('uniqueArtistsCard')}</CardTitle>
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {stats.uniqueArtists > 0 ? stats.uniqueArtists.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.uniqueArtists > 0 ? t('differentArtists') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('mainCountry')}</CardTitle>
                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">{stats.topCountry}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.topCountry !== '——' ? t('mostListenedIn') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('avgSession')}</CardTitle>
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {stats.avgSessionLength > 0 ? `${stats.avgSessionLength} min` : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.avgSessionLength > 0 ? t('perSession') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('totalPodcastPlaysCard')}</CardTitle>
                        <Radio className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {podcastStats.totalPodcastPlays > 0 ? podcastStats.totalPodcastPlays.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {podcastStats.totalPodcastPlays > 0 ? t('playsLabel') : t('noData')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">{t('uniqueShowsCard')}</CardTitle>
                        <Radio className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-lg sm:text-2xl font-bold">
                            {podcastStats.uniqueShows > 0 ? podcastStats.uniqueShows.toLocaleString() : '——'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {podcastStats.uniqueShows > 0 ? t('differentShows') || 'Different shows' : t('noData')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Content - Music */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Top Artists */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-lg sm:text-xl">{t('topArtistsTitle')}</CardTitle>
                        <CardDescription className="text-sm">
                            {t('topArtistsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3 sm:space-y-4">
                            {topArtists.length > 0 ? (
                                topArtists.map((artist, index) => (
                                    <div key={index} className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {artist.name}
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            {artist.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    <div className="text-3xl sm:text-4xl mb-2">🎤</div>
                                    <div className="text-sm sm:text-base">{t('noArtistsData')}</div>
                                    <div className="text-xs sm:text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Tracks */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-lg sm:text-xl">{t('topTracksTitle')}</CardTitle>
                        <CardDescription className="text-sm">
                            {t('topTracksDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3 sm:space-y-4">
                            {topTracks.length > 0 ? (
                                topTracks.map((track, index) => (
                                    <div key={index} className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {track.name}
                                            </div>
                                            <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                                {track.artist}
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            {track.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    <div className="text-3xl sm:text-4xl mb-2">🎵</div>
                                    <div className="text-sm sm:text-base">{t('noTracksData')}</div>
                                    <div className="text-xs sm:text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Content - Podcasts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Top Shows */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-lg sm:text-xl">{t('topShowsTitle')}</CardTitle>
                        <CardDescription className="text-sm">
                            {t('topShowsDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3 sm:space-y-4">
                            {topShows.length > 0 ? (
                                topShows.map((show, index) => (
                                    <div key={index} className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {show.name}
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            {show.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    <div className="text-3xl sm:text-4xl mb-2">🎙️</div>
                                    <div className="text-sm sm:text-base">{t('noShowsData')}</div>
                                    <div className="text-xs sm:text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Episodes */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-lg sm:text-xl">{t('topEpisodesTitle')}</CardTitle>
                        <CardDescription className="text-sm">
                            {t('topEpisodesDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3 sm:space-y-4">
                            {topEpisodes.length > 0 ? (
                                topEpisodes.map((episode, index) => (
                                    <div key={index} className="flex items-center space-x-3 sm:space-x-4">
                                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate">
                                                {episode.name}
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                            {episode.plays} {t('playsLabel')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    <div className="text-3xl sm:text-4xl mb-2">🎧</div>
                                    <div className="text-sm sm:text-base">{t('noEpisodesData')}</div>
                                    <div className="text-xs sm:text-sm">{t('importSpotifyData')}</div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Data Import Guide */}
            <DataImportGuide />
        </div>
    )
}

export default Dashboard
