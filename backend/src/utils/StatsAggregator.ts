import { DailyStats, YearlyStats, CountryStats, ArtistStats, Play } from '../models/index.js'
import { fn, col, Op, literal, QueryTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export class StatsAggregator {
    private profileId: number

    constructor(profileId: number) {
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
            DailyStats.destroy({ where: { profileId: this.profileId } }),
            YearlyStats.destroy({ where: { profileId: this.profileId } }),
            CountryStats.destroy({ where: { profileId: this.profileId } }),
            ArtistStats.destroy({ where: { profileId: this.profileId } })
        ])
    }

    /**
     * Agreguje statystyki dzienne
     */
    private async aggregateDailyStats(): Promise<void> {
        console.log('📅 Aggregating daily stats...')

        // Podstawowe statystyki dzienne
        const dailyData = await Play.findAll({
            where: { profileId: this.profileId },
            attributes: [
                [fn('DATE', col('timestamp')), 'date'],
                [fn('COUNT', col('id')), 'totalPlays'],
                [fn('SUM', col('msPlayed')), 'totalMsPlayed'],
                [fn('COUNT', fn('DISTINCT', col('trackId'))), 'uniqueTracks']
            ],
            group: [fn('DATE', col('timestamp'))],
            order: [[fn('DATE', col('timestamp')), 'ASC']],
            raw: true
        })

        // Pobieramy unikalnych artystów per dzień
        const artistCounts = await sequelize.query(`
            SELECT 
                DATE(p.timestamp) as date,
                COUNT(DISTINCT ar.id) as unique_artists
            FROM plays p
            JOIN tracks t ON p."trackId" = t.id
            JOIN albums al ON t."albumId" = al.id
            JOIN artists ar ON al."artistId" = ar.id
            WHERE p."profileId" = :profileId
            GROUP BY DATE(p.timestamp)
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        }) as any[]

        const artistCountsMap = new Map(artistCounts.map(r => [r.date, parseInt(r.unique_artists)]))

        // Pobieramy Top Artist per dzień
        const topArtists = await sequelize.query(`
            SELECT DISTINCT ON (date)
                date,
                artist_name,
                plays
            FROM (
                SELECT 
                    DATE(p.timestamp) as date,
                    ar.name as artist_name,
                    COUNT(*) as plays
                FROM plays p
                JOIN tracks t ON p."trackId" = t.id
                JOIN albums al ON t."albumId" = al.id
                JOIN artists ar ON al."artistId" = ar.id
                WHERE p."profileId" = :profileId
                GROUP BY date, ar.id, ar.name
            ) sub
            ORDER BY date, plays DESC
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        }) as any[]

        const topArtistsMap = new Map(topArtists.map(r => [r.date, { name: r.artist_name, plays: parseInt(r.plays) }]))

        // Pobieramy Top Track per dzień
        const topTracks = await sequelize.query(`
            SELECT DISTINCT ON (date)
                date,
                track_name,
                artist_name,
                plays
            FROM (
                SELECT 
                    DATE(p.timestamp) as date,
                    t.name as track_name,
                    ar.name as artist_name,
                    COUNT(*) as plays
                FROM plays p
                JOIN tracks t ON p."trackId" = t.id
                JOIN albums al ON t."albumId" = al.id
                JOIN artists ar ON al."artistId" = ar.id
                WHERE p."profileId" = :profileId
                GROUP BY date, t.id, t.name, ar.name
            ) sub
            ORDER BY date, plays DESC
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        }) as any[]

        const topTracksMap = new Map(topTracks.map(r => [r.date, { name: r.track_name, artist: r.artist_name, plays: parseInt(r.plays) }]))

        const dailyStats = (dailyData as any[]).map(day => ({
            profileId: this.profileId,
            date: day.date,
            totalPlays: parseInt(day.totalPlays),
            totalMinutes: Math.round(parseInt(day.totalMsPlayed) / 60000),
            uniqueTracks: parseInt(day.uniqueTracks),
            uniqueArtists: artistCountsMap.get(day.date) || 0,
            topTrack: topTracksMap.get(day.date) || null,
            topArtist: topArtistsMap.get(day.date) || null,
            createdAt: new Date(),
            updatedAt: new Date()
        }))

        if (dailyStats.length > 0) {
            await DailyStats.bulkCreate(dailyStats)
        }

        console.log(`   ✅ Created ${dailyStats.length} daily stats records`)
    }

    /**
     * Agreguje statystyki roczne
     */
    private async aggregateYearlyStats(): Promise<void> {
        console.log('📅 Aggregating yearly stats...')

        // Podstawowe statystyki roczne
        const yearlyData = await Play.findAll({
            where: { profileId: this.profileId },
            attributes: [
                [fn('EXTRACT', literal('YEAR FROM "timestamp"')), 'year'],
                [fn('COUNT', col('id')), 'totalPlays'],
                [fn('SUM', col('msPlayed')), 'totalMsPlayed'],
                [fn('COUNT', fn('DISTINCT', col('trackId'))), 'uniqueTracks']
            ],
            group: [fn('EXTRACT', literal('YEAR FROM "timestamp"'))],
            order: [[fn('EXTRACT', literal('YEAR FROM "timestamp"')), 'ASC']],
            raw: true
        })

        // Pobieramy unikalnych artystów i albumy per rok
        const yearlyCounts = await sequelize.query(`
            SELECT 
                EXTRACT(YEAR FROM p.timestamp)::int as year,
                COUNT(DISTINCT ar.id) as unique_artists,
                COUNT(DISTINCT al.id) as unique_albums
            FROM plays p
            JOIN tracks t ON p."trackId" = t.id
            JOIN albums al ON t."albumId" = al.id
            JOIN artists ar ON al."artistId" = ar.id
            WHERE p."profileId" = :profileId
            GROUP BY EXTRACT(YEAR FROM p.timestamp)::int
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        }) as any[]

        const yearlyCountsMap = new Map(yearlyCounts.map(r => [r.year, r]))

        // Pobieramy Top Artist per rok
        const topArtists = await sequelize.query(`
            SELECT DISTINCT ON (year)
                year,
                artist_name,
                plays,
                minutes
            FROM (
                SELECT 
                    EXTRACT(YEAR FROM p.timestamp)::int as year,
                    ar.name as artist_name,
                    COUNT(*) as plays,
                    SUM(p."msPlayed") as minutes
                FROM plays p
                JOIN tracks t ON p."trackId" = t.id
                JOIN albums al ON t."albumId" = al.id
                JOIN artists ar ON al."artistId" = ar.id
                WHERE p."profileId" = :profileId
                GROUP BY year, ar.id, ar.name
            ) sub
            ORDER BY year, plays DESC
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        }) as any[]

        const topArtistsMap = new Map(topArtists.map(r => [r.year, { 
            name: r.artist_name, 
            plays: parseInt(r.plays),
            minutes: Math.round(parseInt(r.minutes || r.ms) / 60000)
        }]))

        // Pobieramy Top Track per rok
        const topTracks = await sequelize.query(`
            SELECT DISTINCT ON (year)
                year,
                track_name,
                artist_name,
                plays,
                minutes
            FROM (
                SELECT 
                    EXTRACT(YEAR FROM p.timestamp)::int as year,
                    t.name as track_name,
                    ar.name as artist_name,
                    COUNT(*) as plays,
                    SUM(p."msPlayed") as minutes
                FROM plays p
                JOIN tracks t ON p."trackId" = t.id
                JOIN albums al ON t."albumId" = al.id
                JOIN artists ar ON al."artistId" = ar.id
                WHERE p."profileId" = :profileId
                GROUP BY year, t.id, t.name, ar.name
            ) sub
            ORDER BY year, plays DESC
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        }) as any[]

        const topTracksMap = new Map(topTracks.map(r => [r.year, { 
            name: r.track_name, 
            artist: r.artist_name, 
            plays: parseInt(r.plays),
            minutes: Math.round(parseInt(r.minutes || r.ms) / 60000)
        }]))

        const yearlyStats = (yearlyData as any[]).map(yearData => {
            const year = parseInt(yearData.year)
            const counts = yearlyCountsMap.get(year) || { unique_artists: 0, unique_albums: 0 }
            
            return {
                profileId: this.profileId,
                year,
                totalPlays: parseInt(yearData.totalPlays),
                totalMinutes: Math.round(parseInt(yearData.totalMsPlayed) / 60000),
                uniqueTracks: parseInt(yearData.uniqueTracks),
                uniqueArtists: parseInt(counts.unique_artists),
                uniqueAlbums: parseInt(counts.unique_albums),
                topArtist: topArtistsMap.get(year) || null,
                topTrack: topTracksMap.get(year) || null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        if (yearlyStats.length > 0) {
            await YearlyStats.bulkCreate(yearlyStats)
        }

        console.log(`   ✅ Created ${yearlyStats.length} yearly stats records`)
    }

    /**
     * Agreguje statystyki krajów
     */
    private async aggregateCountryStats(): Promise<void> {
        console.log('🌍 Aggregating country stats...')

        const countryData = await Play.findAll({
            where: {
                profileId: this.profileId,
                country: { [Op.ne]: null }
            },
            attributes: [
                'country',
                [fn('COUNT', col('id')), 'totalPlays'],
                [fn('SUM', col('msPlayed')), 'totalMsPlayed']
            ],
            group: ['country'],
            order: [[fn('COUNT', col('id')), 'DESC']],
            raw: true
        })

        const countryStats = (countryData as any[]).map(country => ({
            profileId: this.profileId,
            country: country.country,
            totalPlays: parseInt(country.totalPlays),
            totalMinutes: Math.round(parseInt(country.totalMsPlayed) / 60000),
            createdAt: new Date(),
            updatedAt: new Date()
        }))

        if (countryStats.length > 0) {
            await CountryStats.bulkCreate(countryStats)
        }

        console.log(`   ✅ Created ${countryStats.length} country stats records`)
    }

    /**
     * Agreguje statystyki artystów
     */
    private async aggregateArtistStats(): Promise<void> {
        console.log('🎤 Aggregating artist stats...')

        // Używamy surowego SQL query dla lepszej kontroli
        const artistData = await sequelize.query(`
            SELECT 
                artists.id as artist_id,
                artists.name as artist_name,
                COUNT(plays.id) as total_plays,
                SUM(plays."msPlayed") as total_ms_played
            FROM plays
            JOIN tracks ON plays."trackId" = tracks.id
            JOIN albums ON tracks."albumId" = albums.id  
            JOIN artists ON albums."artistId" = artists.id
            WHERE plays."profileId" = :profileId
            GROUP BY artists.id, artists.name
            ORDER BY COUNT(plays.id) DESC
        `, {
            replacements: { profileId: this.profileId },
            type: QueryTypes.SELECT
        })

        const artistStats = (artistData as any[]).map(artist => ({
            profileId: this.profileId,
            artistId: parseInt(artist.artist_id),
            artistName: artist.artist_name,
            totalPlays: parseInt(artist.total_plays),
            totalMinutes: Math.round(parseInt(artist.total_ms_played) / 60000),
            createdAt: new Date(),
            updatedAt: new Date()
        }))

        if (artistStats.length > 0) {
            await ArtistStats.bulkCreate(artistStats)
        }

        console.log(`   ✅ Created ${artistStats.length} artist stats records`)
    }
}
