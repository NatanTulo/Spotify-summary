import { DailyStats, YearlyStats, CountryStats, ArtistStats, Play } from '../models/index.js'
import { Track } from '../models/Track.js'
import { Album } from '../models/Album.js'
import { Artist } from '../models/Artist.js'
import { fn, col, Op, literal } from 'sequelize'

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

        const dailyStats = (dailyData as any[]).map(day => ({
            profileId: this.profileId,
            date: day.date,
            totalPlays: parseInt(day.totalPlays),
            totalMinutes: Math.round(parseInt(day.totalMsPlayed) / 60000),
            uniqueTracks: parseInt(day.uniqueTracks),
            topTrack: 'Unknown', // TODO: Implement top track calculation
            topArtist: 'Unknown', // TODO: Implement top artist calculation
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

        const yearlyStats = (yearlyData as any[]).map(year => ({
            profileId: this.profileId,
            year: parseInt(year.year),
            totalPlays: parseInt(year.totalPlays),
            totalMinutes: Math.round(parseInt(year.totalMsPlayed) / 60000),
            uniqueTracks: parseInt(year.uniqueTracks),
            topGenre: 'Unknown', // TODO: Implement genre calculation
            createdAt: new Date(),
            updatedAt: new Date()
        }))

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

        // Najpierw pobieramy dane o artystach
        const artistData = await Play.findAll({
            where: { profileId: this.profileId },
            include: [
                {
                    model: Track,
                    as: 'track',
                    include: [
                        {
                            model: Album,
                            as: 'album',
                            include: [
                                {
                                    model: Artist,
                                    as: 'artist'
                                }
                            ]
                        }
                    ]
                }
            ],
            attributes: [
                [fn('COUNT', col('Play.id')), 'totalPlays'],
                [fn('SUM', col('Play.msPlayed')), 'totalMsPlayed']
            ],
            group: [
                'track.album.artist.id',
                'track.album.artist.name'
            ],
            order: [[fn('COUNT', col('Play.id')), 'DESC']],
            raw: true
        })

        const artistStats = (artistData as any[]).map(artist => ({
            profileId: this.profileId,
            artistName: artist['track.album.artist.name'],
            totalPlays: parseInt(artist.totalPlays),
            totalMinutes: Math.round(parseInt(artist.totalMsPlayed) / 60000),
            createdAt: new Date(),
            updatedAt: new Date()
        }))

        if (artistStats.length > 0) {
            await ArtistStats.bulkCreate(artistStats)
        }

        console.log(`   ✅ Created ${artistStats.length} artist stats records`)
    }
}
