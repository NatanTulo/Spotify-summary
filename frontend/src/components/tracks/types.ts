
export interface ExtendedTrack {
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  totalPlays: number;
  totalMinutes: number;
  avgPlayDuration: number;
  skipPercentage: number;
  // Dodatkowe pola z API response
  artist?: {
    id: string;
    name: string;
  };
  album?: {
    id: string;
    name: string;
  };
  // Dodatkowe pola z dokumentacji Spotify
  uri?: string;
  duration?: number;
  platforms?: string[];
  countries?: string[];
  firstPlay?: Date | string;
  lastPlay?: Date | string;
  username?: string;
  reasonStart?: string[];
  reasonEnd?: string[];
  shuffle?: boolean | null;
  offline?: boolean | null;
  incognitoMode?: boolean | null;
}

export interface ColumnConfig {
  key: keyof ExtendedTrack;
  sortable: boolean;
  format?: (value: any) => string;
  labelKey: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
