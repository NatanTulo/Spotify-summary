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
} from '../types';

// Overview stats hook
export function useOverviewStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'overview', profileId],
    queryFn: () => apiGet<OverviewStats>(`/stats/overview${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
  });
}

// Yearly stats hook
export function useYearlyStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'yearly', profileId],
    queryFn: () => apiGet<YearlyStats[]>(`/stats/yearly${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
  });
}

// Timeline hook
export function useTimeline(profileId: number | 'all', period: 'day' | 'week' | 'month' | 'year' = 'day') {
  return useQuery({
    queryKey: ['stats', 'timeline', profileId, period],
    queryFn: () => apiGet<TimelineData[]>(`/stats/timeline${buildQuery({ 
      profileId: profileId === 'all' ? undefined : profileId,
      period 
    })}`),
  });
}

// Time of day hook
export function useTimeOfDay(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'timeOfDay', profileId],
    queryFn: () => apiGet<HourlyData[]>(`/stats/time-of-day${buildQuery({ profileId })}`),
  });
}

// Day of week hook
export function useDayOfWeek(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'dayOfWeek', profileId],
    queryFn: () => apiGet<DayOfWeekData[]>(`/stats/day-of-week${buildQuery({ profileId })}`),
  });
}

// Country stats hook
export function useCountryStats(profileId: number | 'all') {
  return useQuery({
    queryKey: ['stats', 'countries', profileId],
    queryFn: () => apiGet<CountryStats[]>(`/stats/countries${buildQuery({ profileId: profileId === 'all' ? undefined : profileId })}`),
  });
}

// Top artists hook
export function useTopArtists(profileId: number | 'all', limit: number = 10) {
  return useQuery({
    queryKey: ['artists', 'top', profileId, limit],
    queryFn: () => apiGet<Artist[]>(`/artists/top${buildQuery({ profileId, limit })}`),
  });
}

// Tracks response type
interface TracksResponse {
  success: boolean;
  data: Track[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// Tracks hook with pagination
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
    queryFn: async () => {
      const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : '/api';
      const response = await fetch(`${API_BASE}/tracks${query}`);
      const json = await response.json();
      return json as TracksResponse;
    },
  });
}

// Albums response type
interface AlbumsResponse {
  success: boolean;
  data: Album[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// Albums hook
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
    queryFn: async () => {
      const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api' 
        : '/api';
      const response = await fetch(`${API_BASE}/albums${query}`);
      const json = await response.json();
      return json as AlbumsResponse;
    },
  });
}

