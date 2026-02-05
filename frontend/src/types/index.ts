// Profile types
export interface Profile {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Statistics types
export interface OverviewStats {
  totalPlays: number;
  totalMinutes: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  avgSessionDuration: number;
  topCountry: string;
}

export interface YearlyStats {
  year: number;
  plays: number;
  totalMinutes: number;
}

export interface TimelineData {
  period: string;
  plays: number;
  totalMinutes: number;
}

export interface HourlyData {
  hour: number;
  plays: number;
  totalMinutes: number;
}

export interface DayOfWeekData {
  dow: number;
  plays: number;
  totalMinutes: number;
}

// Track types
export interface Track {
  id: number;
  trackId: string;
  trackName: string;
  name: string;
  duration: number;
  uri: string;
  artistName: string;
  albumName: string;
  artist: { id: number; name: string };
  album: { id: number; name: string };
  totalPlays: number;
  totalMinutes: number;
  avgPlayDuration: number;
  skipPercentage: number;
  firstPlay: string | null;
  lastPlay: string | null;
  platforms: string[];
  countries: string[];
  reasonStart: string[];
  reasonEnd: string[];
  stats: TrackStats;
}

export interface TrackStats {
  totalPlays: number;
  totalMinutes: number;
  avgPlayDuration: number;
  skipPercentage: number;
}

// Artist types
export interface Artist {
  id: number;
  name: string;
  plays: number;
  minutes: number;
}

// Album types
export interface Album {
  id: number;
  name: string;
  artist: string;
  plays: number;
  minutes: number;
}

// Podcast types
export interface PodcastShow {
  id: number;
  name: string;
  publisher: string;
  playCount: number;
  totalMs: number;
}

export interface PodcastEpisode {
  id: number;
  name: string;
  showName: string;
  playCount: number;
  totalMs: number;
}

export interface PodcastStats {
  totalPodcastPlays: number;
  totalPodcastMinutes: number;
  uniqueShows: number;
  uniqueEpisodes: number;
}

// Audiobook types
export interface Audiobook {
  id: number;
  name: string;
  author: string;
  spotifyUri: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

// Country stats
export interface CountryStats {
  country: string;
  plays: number;
  totalMinutes: number;
}
