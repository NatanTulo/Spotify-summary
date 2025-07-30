import { Sequelize } from 'sequelize-typescript'
import { Artist } from '../models/music/Artist.js'
import { Album } from '../models/music/Album.js'
import { Track } from '../models/music/Track.js'
import { Play } from '../models/music/Play.js'
import { Profile } from '../models/common/Profile.js'
import { ArtistStats } from '../models/stats/ArtistStats.js'
import { CountryStats } from '../models/stats/CountryStats.js'
import { DailyStats } from '../models/stats/DailyStats.js'
import { YearlyStats } from '../models/stats/YearlyStats.js'
import { Show } from '../models/podcasts/Show.js'
import { Episode } from '../models/podcasts/Episode.js'
import { PodcastPlay } from '../models/podcasts/PodcastPlay.js'
import { Audiobook } from '../models/audiobooks/Audiobook.js'
import { AudiobookPlay } from '../models/audiobooks/AudiobookPlay.js'

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'spotify_analytics',
    models: [
        Artist,
        Album,
        Track,
        Play,
        Profile,
        ArtistStats,
        CountryStats,
        DailyStats,
        YearlyStats,
        Show,
        Episode,
        PodcastPlay,
        Audiobook,
        AudiobookPlay
    ],
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true
    }
})

export const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate()
        console.log('✅ PostgreSQL connected successfully')

        // Synchronize database in development
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: true })
            console.log('✅ Database synchronized successfully')
        }

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await sequelize.close()
            console.log('💤 PostgreSQL connection closed through app termination')
            process.exit(0)
        })

    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error)
        process.exit(1)
    }
}

export { sequelize }
export default sequelize
