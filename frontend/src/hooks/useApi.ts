import { useQuery } from '@tanstack/react-query';
import { apiGet, buildQuery } from '../api/client';
import type {
  OverviewStats,
  YearlyStats,
  TimelineData,
  HourlyData,
  DayOfWeekData,
  Track,
  Artist,
  Album,
  CountryStats,
  PodcastShow,
  PodcastEpisode,
  PodcastStats,
  Audiobook,
} from '../types';

// ============================================
// STATISTICS HOOKS
// ============================================

export function useOverviewStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'overview', profileId],
    queryFn: () => apiGet<OverviewStats>(`/stats/overview${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
  });
}

export function useYearlyStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'yearly', profileId],
    queryFn: () => apiGet<YearlyStats[]>(`/stats/yearly${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
  });
}

export function useTimeline(profileId: number | 'all', period: 'day' | 'week' | 'month' | 'year' = 'day') {
  return useQuery({
    queryKey: ['stats', 'timeline', profileId, period],
    queryFn: () => apiGet<TimelineData[]>(`/stats/timeline${buildQuery({ 
      profileId: profileId === 'all' ? undefined : profileId,
      period 
    })}`),
  });
}

export function useTimeOfDay(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'timeOfDay', profileId],
    queryFn: () => apiGet<HourlyData[]>(`/stats/time-of-day${buildQuery({ profileId })}`),
  });
}

export function useDayOfWeek(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'dayOfWeek', profileId],
    queryFn: () => apiGet<DayOfWeekData[]>(`/stats/day-of-week${buildQuery({ profileId })}`),
  });
}

export function useCountryStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'countries', profileId],
    queryFn: () => apiGet<CountryStats[]>(`/stats/countries${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
  });
}

// Metadata (platforms, countries for filtering)
interface MetadataResponse {
  countries: string[];
  platforms: string[];
}

export function useMetadata(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'metadata', profileId],
    queryFn: () => apiGet<MetadataResponse>(`/stats/metadata${buildQuery({ profileId })}`),
  });
}

// ============================================
// ARTISTS HOOKS
// ============================================

export function useTopArtists(profileId: number | 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['artists', 'top', profileId, limit],
    queryFn: () => apiGet<Artist[]>(`/artists/top${buildQuery({ profileId, limit })}`),
  });
}

// ============================================
// TRACKS HOOKS
// ============================================

interface TracksResponse {
  success: boolean;
  data: Track[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function useTracks(params: {
  profileId?: number | 'all';
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}) {
  const query = buildQuery({
    profileId: params.profileId === 'all' ? undefined : params.profileId,
    page: params.page,
    limit: params.limit,
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return useQuery({
    queryKey: ['tracks', params],
    queryFn: () => apiGet<TracksResponse>(`/tracks${query}`),
  });
}

// Track details
interface TrackDetail {
  id: number;
  name: string;
  duration: number;
  uri: string;
  album: {
    id: number;
    name: string;
    artist: { id: number; name: string };
  };
  stats: {
    totalPlays: number;
    totalMinutes: number;
    avgPlayDuration: number;
    skipPercentage: number;
    firstPlay: string | null;
    lastPlay: string | null;
  };
  recentPlays: PlayEvent[];
}

interface PlayEvent {
  id: number;
  playedAt: string;
  msPlayed: number;
  skipped: boolean;
  platform: string;
  country: string;
  reasonStart: string;
  reasonEnd: string;
  shuffle: boolean;
  offline: boolean;
}

export function useTrackDetail(trackId: number, profileId?: number | 'all') {
  return useQuery({
    queryKey: ['track', trackId, profileId],
    queryFn: () => apiGet<TrackDetail>(`/tracks/${trackId}${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
    enabled: !!trackId,
  });
}

// Track timeline
interface TrackTimelineEntry {
  date: string;
  plays: number;
  minutes: number;
}

export function useTrackTimeline(trackId: number, profileId?: number | 'all') {
  return useQuery({
    queryKey: ['track', 'timeline', trackId, profileId],
    queryFn: () => apiGet<{ data: TrackTimelineEntry[]; count: number }>(`/tracks/${trackId}/timeline${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
    enabled: !!trackId,
  });
}

// Track plays history
interface TrackPlaysResponse {
  success: boolean;
  data: PlayEvent[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function useTrackPlays(trackId: number, params: { profileId?: number | 'all'; page?: number; limit?: number }) {
  const query = buildQuery({
    profileId: params.profileId === 'all' ? undefined : params.profileId,
    page: params.page,
    limit: params.limit,
  });
  
  return useQuery({
    queryKey: ['track', 'plays', trackId, params],
    queryFn: () => apiGet<TrackPlaysResponse>(`/tracks/${trackId}/plays${query}`),
    enabled: !!trackId,
  });
}

// ============================================
// ALBUMS HOOKS
// ============================================

interface AlbumsResponse {
  success: boolean;
  data: Album[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export function useAlbums(params: {
  profileId?: number | 'all';
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}) {
  const query = buildQuery({
    profileId: params.profileId === 'all' ? undefined : params.profileId,
    page: params.page,
    limit: params.limit,
    search: params.search,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return useQuery({
    queryKey: ['albums', params],
    queryFn: () => apiGet<AlbumsResponse>(`/albums${query}`),
  });
}

// ============================================
// PODCAST HOOKS
// ============================================

interface PodcastShowsResponse {
  shows: PodcastShow[];
  total: number;
  limit: number;
  offset: number;
}

export function usePodcastShows(profileId: number | 'all', params?: { limit?: number; offset?: number; sortBy?: string; order?: string }) {
  const query = buildQuery({
    profileId: profileId === 'all' ? undefined : profileId,
    limit: params?.limit,
    offset: params?.offset,
    sortBy: params?.sortBy,
    order: params?.order,
  });
  
  return useQuery({
    queryKey: ['podcasts', 'shows', profileId, params],
    queryFn: () => apiGet<PodcastShowsResponse>(`/podcasts/shows${query}`),
  });
}

interface PodcastEpisodesResponse {
  episodes: PodcastEpisode[];
  total: number;
  limit: number;
  offset: number;
}

export function usePodcastEpisodes(showId: number, profileId: number | 'all', params?: { limit?: number; offset?: number }) {
  const query = buildQuery({
    profileId: profileId === 'all' ? undefined : profileId,
    limit: params?.limit,
    offset: params?.offset,
  });
  
  return useQuery({
    queryKey: ['podcasts', 'episodes', showId, profileId, params],
    queryFn: () => apiGet<PodcastEpisodesResponse>(`/podcasts/shows/${showId}/episodes${query}`),
    enabled: !!showId,
  });
}

export function usePodcastStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['podcasts', 'stats', profileId],
    queryFn: () => apiGet<PodcastStats>(`/podcasts/stats${buildQuery({ profileId })}`),
  });
}

export function useTopPodcastShows(profileId: number | 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['podcasts', 'topShows', profileId, limit],
    queryFn: () => apiGet<PodcastShow[]>(`/podcasts/top-shows${buildQuery({ profileId, limit })}`),
  });
}

export function useTopPodcastEpisodes(profileId: number | 'all', limit: number = 20) {
  return useQuery({
    queryKey: ['podcasts', 'topEpisodes', profileId, limit],
    queryFn: () => apiGet<PodcastEpisode[]>(`/podcasts/top-episodes${buildQuery({ profileId, limit })}`),
  });
}

export function usePodcastTimeOfDay(profileId: number | 'all') {
  return useQuery({
    queryKey: ['podcasts', 'timeOfDay', profileId],
    queryFn: () => apiGet<HourlyData[]>(`/podcasts/time-of-day${buildQuery({ profileId })}`),
  });
}

export function usePodcastDayOfWeek(profileId: number | 'all') {
  return useQuery({
    queryKey: ['podcasts', 'dayOfWeek', profileId],
    queryFn: () => apiGet<DayOfWeekData[]>(`/podcasts/day-of-week${buildQuery({ profileId })}`),
  });
}

// ============================================
// AUDIOBOOK HOOKS
// ============================================

interface AudiobooksResponse {
  audiobooks: Audiobook[];
  pagination: { current: number; pages: number; total: number };
  isEmpty: boolean;
}

export function useAudiobooks(profileId: number | 'all', params?: { page?: number; limit?: number; search?: string }) {
  const query = buildQuery({
    page: params?.page,
    limit: params?.limit,
    search: params?.search,
  });
  
  return useQuery({
    queryKey: ['audiobooks', profileId, params],
    queryFn: () => apiGet<AudiobooksResponse>(`/audiobooks/${profileId === 'all' ? 'all' : profileId}${query}`),
  });
}

// ============================================
// SPECIAL ANALYTICS HOOKS (for unique designs)
// ============================================

// "Forgotten Gems" - tracks not played in 6+ months but have 10+ plays
export function useForgottenTracks(profileId: number | 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['tracks', 'forgotten', profileId, limit],
    queryFn: async () => {
      // Get tracks sorted by lastPlay ascending (oldest first)
      const response = await apiGet<TracksResponse>(`/tracks${buildQuery({
        profileId: profileId === 'all' ? undefined : profileId,
        sortBy: 'lastPlay',
        sortOrder: 'ASC',
        limit: 50,
      })}`);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Filter: lastPlay > 6 months ago AND totalPlays >= 10
      const forgotten = response.data.filter(track => {
        if (!track.lastPlay) return false;
        const lastPlay = new Date(track.lastPlay);
        return lastPlay < sixMonthsAgo && track.totalPlays >= 10;
      }).slice(0, limit);
      
      return forgotten;
    },
  });
}

// Tracks by skip percentage (most skipped)
export function useMostSkippedTracks(profileId: number | 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['tracks', 'skipped', profileId, limit],
    queryFn: async () => {
      const response = await apiGet<TracksResponse>(`/tracks${buildQuery({
        profileId: profileId === 'all' ? undefined : profileId,
        limit: 100,
      })}`);
      
      // Sort by skipPercentage descending and filter tracks with enough plays
      const skipped = response.data
        .filter(track => track.totalPlays >= 5)
        .sort((a, b) => (b.skipPercentage || 0) - (a.skipPercentage || 0))
        .slice(0, limit);
      
      return skipped;
    },
  });
}

// Recently discovered artists (first play in last 30 days)
export function useRecentlyDiscovered(profileId: number | 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['tracks', 'discovered', profileId, limit],
    queryFn: async () => {
      const response = await apiGet<TracksResponse>(`/tracks${buildQuery({
        profileId: profileId === 'all' ? undefined : profileId,
        sortBy: 'firstPlay',
        sortOrder: 'DESC',
        limit: 50,
      })}`);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter: firstPlay in last 30 days
      const discovered = response.data.filter(track => {
        if (!track.firstPlay) return false;
        const firstPlay = new Date(track.firstPlay);
        return firstPlay > thirtyDaysAgo;
      }).slice(0, limit);
      
      return discovered;
    },
  });
}

// Tracks by platform
export function useTracksByPlatform(profileId: number | 'all') {
  return useQuery({
    queryKey: ['tracks', 'byPlatform', profileId],
    queryFn: async () => {
      const response = await apiGet<TracksResponse>(`/tracks${buildQuery({
        profileId: profileId === 'all' ? undefined : profileId,
        limit: 200,
      })}`);
      
      // Count plays by platform
      const platformCounts: Record<string, number> = {};
      response.data.forEach(track => {
        track.platforms?.forEach(platform => {
          platformCounts[platform] = (platformCounts[platform] || 0) + track.totalPlays;
        });
      });
      
      return Object.entries(platformCounts)
        .map(([platform, plays]) => ({ platform, plays }))
        .sort((a, b) => b.plays - a.plays);
    },
  });
}
