export interface Track {
    trackId: string
    trackName: string
    artistName: string
    albumName: string
    totalPlays: number
    totalMinutes: number
    avgPlayDuration: number
    skipPercentage: number
}

export interface TopArtist {
    name: string
    plays: number
    minutes: number
}

export interface FilterState {
    search: string
    minPlays: number
    dateFrom: string
    dateTo: string
    country: string
    platform: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
    showSkipped: boolean
    showShuffle: boolean
}

export interface TimeOfDayStat {
    hour: number;
    plays: number;
    totalMinutes: number;
}

export interface DayOfWeekStat {
    dow: number;
    plays: number;
    totalMinutes: number;
}

export interface TimelineStat {
    date: string;
    plays: number;
    minutes: number;
}
