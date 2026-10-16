export interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

export interface ApiSuccess<T> { success: true; data: T; pagination?: Pagination }
export interface ApiFailure { success: false; error: string; code: string }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
export interface DateRange { dateFrom: string; dateTo: string }
export interface PeriodSummary {
    plays: number; minutes: number; tracks: number; artists: number; albums: number
    podcastPlays: number; podcastMinutes: number; audiobookPlays: number; audiobookMinutes: number
}
export interface CalendarDay { date: string; plays: number; minutes: number }
export interface ArtistDiscovery { id: number; name: string; firstPlayed: string; plays: number }
export interface Insights {
    current: PeriodSummary
    previous: PeriodSummary
    currentRange: DateRange
    previousRange: DateRange
    calendar: CalendarDay[]
    discoveries: ArtistDiscovery[]
}
