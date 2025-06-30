import { DailyStats, YearlyStats, CountryStats, ArtistStats, Play } from '../models/index.js'
import mongoose from 'mongoose'

export class StatsAggregator {
    private profileId: mongoose.Types.ObjectId

    constructor(profileId: mongoose.Types.ObjectId) {
        this.profileId = profileId
    }

    /**
     * Agreguje wszystkie statystyki dla profilu
     */
    async aggregateAllStats(): Promise<void> {
        console.log(`📊 Starting stats aggregation for profile: ${this.profileId}`)

        // Czyścimy stare statystyki
        await this.clearExistingStats()

        // Agregujemy nowe statystyki
        await Promise.all([
            this.aggregateDailyStats(),
            this.aggregateYearlyStats(),
            this.aggregateCountryStats(),
            this.aggregateArtistStats()
        ])

        console.log(`✅ Stats aggregation completed for profile: ${this.profileId}`)
    }

    /**
     * Czyści istniejące statystyki dla profilu
     */
    private async clearExistingStats(): Promise<void> {
        await Promise.all([
            DailyStats.deleteMany({ profileId: this.profileId }),
            YearlyStats.deleteMany({ profileId: this.profileId }),
            CountryStats.deleteMany({ profileId: this.profileId }),
            ArtistStats.deleteMany({ profileId: this.profileId })
        ])
    }

    /**
     * Agreguje statystyki dzienne
     */
    private async aggregateDailyStats(): Promise<void> {
        console.log('📅 Aggregating daily stats...')

        const dailyData = await Play.aggregate([
            { $match: { profileId: this.profileId } },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp"
                            }
                        }
                    },
                    totalPlays: { $sum: 1 },
                    totalMinutes: { $sum: { $divide: ["$msPlayed", 60000] } },
                    uniqueTracks: { $addToSet: "$trackId" },
                    uniqueArtists: { $addToSet: "$artistId" },
                    tracks: {
                        $push: {
                            trackId: "$trackId",
                            trackName: "$trackName",
                            artistName: "$artistName"
                        }
                    }
                }
            },
            {
                $project: {
                    date: "$_id.date",
                    totalPlays: 1,
                    totalMinutes: 1,
                    uniqueTracks: { $size: "$uniqueTracks" },
                    uniqueArtists: { $size: "$uniqueArtists" },
                    tracks: 1
                }
            },
            { $sort: { date: 1 } }
        ])

        const dailyStats = dailyData.map(day => ({
            profileId: this.profileId,
            date: day.date,
            totalPlays: day.totalPlays,
            totalMinutes: Math.round(day.totalMinutes),
            uniqueTracks: day.uniqueTracks,
            uniqueArtists: day.uniqueArtists,
            topTrack: this.getTopTrack(day.tracks),
            topArtist: this.getTopArtist(day.tracks)
        }))

        if (dailyStats.length > 0) {
            await DailyStats.insertMany(dailyStats)
        }
    }

    /**
     * Agreguje statystyki roczne
     */
    private async aggregateYearlyStats(): Promise<void> {
        console.log('📊 Aggregating yearly stats...')

        const yearlyData = await Play.aggregate([
            { $match: { profileId: this.profileId } },
            {
                $group: {
                    _id: {
                        year: { $year: "$timestamp" },
                        month: { $month: "$timestamp" }
                    },
                    totalPlays: { $sum: 1 },
                    totalMinutes: { $sum: { $divide: ["$msPlayed", 60000] } },
                    uniqueTracks: { $addToSet: "$trackId" },
                    uniqueArtists: { $addToSet: "$artistId" },
                    uniqueAlbums: { $addToSet: "$albumId" },
                    tracks: {
                        $push: {
                            trackId: "$trackId",
                            trackName: "$trackName",
                            artistName: "$artistName",
                            msPlayed: "$msPlayed"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$_id.year",
                    totalPlays: { $sum: "$totalPlays" },
                    totalMinutes: { $sum: "$totalMinutes" },
                    uniqueTracks: { $addToSet: "$uniqueTracks" },
                    uniqueArtists: { $addToSet: "$uniqueArtists" },
                    uniqueAlbums: { $addToSet: "$uniqueAlbums" },
                    allTracks: { $push: "$tracks" },
                    monthlyBreakdown: {
                        $push: {
                            month: "$_id.month",
                            plays: "$totalPlays",
                            minutes: "$totalMinutes"
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ])

        const yearlyStats = yearlyData.map(year => {
            const allTracks = year.allTracks.flat()
            return {
                profileId: this.profileId,
                year: year._id,
                totalPlays: year.totalPlays,
                totalMinutes: Math.round(year.totalMinutes),
                uniqueTracks: new Set(year.uniqueTracks.flat()).size,
                uniqueArtists: new Set(year.uniqueArtists.flat()).size,
                uniqueAlbums: new Set(year.uniqueAlbums.flat()).size,
                topTrack: this.getTopTrackWithMinutes(allTracks),
                topArtist: this.getTopArtistWithMinutes(allTracks),
                monthlyBreakdown: year.monthlyBreakdown.map((month: any) => ({
                    month: month.month,
                    plays: month.plays,
                    minutes: Math.round(month.minutes)
                }))
            }
        })

        if (yearlyStats.length > 0) {
            await YearlyStats.insertMany(yearlyStats)
        }
    }

    /**
     * Agreguje statystyki krajowe
     */
    private async aggregateCountryStats(): Promise<void> {
        console.log('🌍 Aggregating country stats...')

        const countryData = await Play.aggregate([
            { $match: { profileId: this.profileId, country: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: "$country",
                    totalPlays: { $sum: 1 },
                    totalMinutes: { $sum: { $divide: ["$msPlayed", 60000] } },
                    uniqueTracks: { $addToSet: "$trackId" },
                    uniqueArtists: { $addToSet: "$artistId" },
                    artists: {
                        $push: {
                            artistName: "$artistName",
                            plays: 1
                        }
                    }
                }
            },
            {
                $project: {
                    country: "$_id",
                    totalPlays: 1,
                    totalMinutes: 1,
                    uniqueTracks: { $size: "$uniqueTracks" },
                    uniqueArtists: { $size: "$uniqueArtists" },
                    artists: 1
                }
            },
            { $sort: { totalPlays: -1 } }
        ])

        // Obliczamy procenty
        const totalPlays = countryData.reduce((sum, country) => sum + country.totalPlays, 0)

        const countryStats = countryData.map(country => ({
            profileId: this.profileId,
            country: country.country,
            totalPlays: country.totalPlays,
            totalMinutes: Math.round(country.totalMinutes),
            percentage: totalPlays > 0 ? (country.totalPlays / totalPlays) * 100 : 0,
            uniqueTracks: country.uniqueTracks,
            uniqueArtists: country.uniqueArtists,
            topArtist: this.getTopArtistFromList(country.artists)
        }))

        if (countryStats.length > 0) {
            await CountryStats.insertMany(countryStats)
        }
    }

    /**
     * Agreguje statystyki artystów
     */
    private async aggregateArtistStats(): Promise<void> {
        console.log('🎤 Aggregating artist stats...')

        const artistData = await Play.aggregate([
            { $match: { profileId: this.profileId } },
            {
                $group: {
                    _id: "$artistId",
                    artistName: { $first: "$artistName" },
                    totalPlays: { $sum: 1 },
                    totalMinutes: { $sum: { $divide: ["$msPlayed", 60000] } },
                    uniqueTracks: { $addToSet: "$trackId" },
                    uniqueAlbums: { $addToSet: "$albumId" },
                    firstPlayDate: { $min: "$playedAt" },
                    lastPlayDate: { $max: "$playedAt" },
                    tracks: {
                        $push: {
                            trackName: "$trackName",
                            msPlayed: "$msPlayed"
                        }
                    }
                }
            },
            {
                $project: {
                    artistId: "$_id",
                    artistName: 1,
                    totalPlays: 1,
                    totalMinutes: 1,
                    uniqueTracks: { $size: "$uniqueTracks" },
                    uniqueAlbums: { $size: "$uniqueAlbums" },
                    firstPlayDate: 1,
                    lastPlayDate: 1,
                    tracks: 1
                }
            },
            { $sort: { totalPlays: -1 } }
        ])

        const artistStats = artistData.map(artist => ({
            profileId: this.profileId,
            artistId: artist.artistId,
            artistName: artist.artistName,
            totalPlays: artist.totalPlays,
            totalMinutes: Math.round(artist.totalMinutes),
            uniqueTracks: artist.uniqueTracks,
            uniqueAlbums: artist.uniqueAlbums,
            firstPlayDate: artist.firstPlayDate,
            lastPlayDate: artist.lastPlayDate,
            topTrack: this.getTopTrackFromList(artist.tracks)
        }))

        if (artistStats.length > 0) {
            await ArtistStats.insertMany(artistStats)
        }
    }

    /**
     * Helpers dla znajdowania top utworów i artystów
     */
    private getTopTrack(tracks: any[]): { name: string; artist: string; plays: number } {
        const trackCounts = tracks.reduce((acc, track) => {
            const key = `${track.trackName}|${track.artistName}`
            acc[key] = (acc[key] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const topTrack = Object.entries(trackCounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0]

        if (!topTrack) return { name: '', artist: '', plays: 0 }

        const [trackInfo, plays] = topTrack
        const [name, artist] = trackInfo.split('|')
        return { name, artist, plays: plays as number }
    }

    private getTopArtist(tracks: any[]): { name: string; plays: number } {
        const artistCounts = tracks.reduce((acc, track) => {
            acc[track.artistName] = (acc[track.artistName] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const topArtist = Object.entries(artistCounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0]

        return topArtist ? { name: topArtist[0], plays: topArtist[1] as number } : { name: '', plays: 0 }
    }

    private getTopTrackWithMinutes(tracks: any[]): { name: string; artist: string; plays: number; minutes: number } {
        const trackData = tracks.reduce((acc, track) => {
            const key = `${track.trackName}|${track.artistName}`
            if (!acc[key]) {
                acc[key] = { plays: 0, minutes: 0 }
            }
            acc[key].plays += 1
            acc[key].minutes += track.msPlayed / 60000
            return acc
        }, {} as Record<string, { plays: number; minutes: number }>)

        const topTrack = Object.entries(trackData)
            .sort(([, a], [, b]) => (b as any).plays - (a as any).plays)[0]

        if (!topTrack) return { name: '', artist: '', plays: 0, minutes: 0 }

        const [trackInfo, data] = topTrack
        const [name, artist] = trackInfo.split('|')
        return { name, artist, plays: (data as any).plays, minutes: Math.round((data as any).minutes) }
    }

    private getTopArtistWithMinutes(tracks: any[]): { name: string; plays: number; minutes: number } {
        const artistData = tracks.reduce((acc, track) => {
            if (!acc[track.artistName]) {
                acc[track.artistName] = { plays: 0, minutes: 0 }
            }
            acc[track.artistName].plays += 1
            acc[track.artistName].minutes += track.msPlayed / 60000
            return acc
        }, {} as Record<string, { plays: number; minutes: number }>)

        const topArtist = Object.entries(artistData)
            .sort(([, a], [, b]) => (b as any).plays - (a as any).plays)[0]

        return topArtist ? {
            name: topArtist[0],
            plays: (topArtist[1] as any).plays,
            minutes: Math.round((topArtist[1] as any).minutes)
        } : { name: '', plays: 0, minutes: 0 }
    }

    private getTopArtistFromList(artists: any[]): { name: string; plays: number } {
        const artistCounts = artists.reduce((acc, artist) => {
            acc[artist.artistName] = (acc[artist.artistName] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const topArtist = Object.entries(artistCounts)
            .sort(([, a], [, b]) => (b as number) - (a as number))[0]

        return topArtist ? { name: topArtist[0], plays: topArtist[1] as number } : { name: '', plays: 0 }
    }

    private getTopTrackFromList(tracks: any[]): { name: string; plays: number; minutes: number } {
        const trackData = tracks.reduce((acc, track) => {
            if (!acc[track.trackName]) {
                acc[track.trackName] = { plays: 0, minutes: 0 }
            }
            acc[track.trackName].plays += 1
            acc[track.trackName].minutes += track.msPlayed / 60000
            return acc
        }, {} as Record<string, { plays: number; minutes: number }>)

        const topTrack = Object.entries(trackData)
            .sort(([, a], [, b]) => (b as any).plays - (a as any).plays)[0]

        return topTrack ? {
            name: topTrack[0],
            plays: (topTrack[1] as any).plays,
            minutes: Math.round((topTrack[1] as any).minutes)
        } : { name: '', plays: 0, minutes: 0 }
    }
}
