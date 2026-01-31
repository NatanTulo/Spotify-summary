export interface PodcastStats {
    totalPodcastPlays: number
    totalPodcastMinutes: number
    uniqueShows: number
    uniqueEpisodes: number
}

export interface TopShow {
    id: string
    name: string
    playCount: number
    totalTime: number
    publisher?: string
}

export interface TopEpisode {
    id: string
    name: string
    showName: string
    playCount: number
    totalTime: number
    releaseDate?: string
}

export interface DailyStats {
    date: string
    plays: number
    minutes: number
}

export interface TimeOfDayStat {
    hour: number;
    plays: number;
    minutes: number;
}

export interface DayOfWeekStat {
    dow: number;
    plays: number;
    minutes: number;
}

export interface ApiResponse<T> {
    success: boolean
    data: T
    error?: string
}
