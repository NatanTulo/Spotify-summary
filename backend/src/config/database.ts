import 'dotenv/config'
import { Sequelize, type SequelizeOptions } from 'sequelize-typescript'
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

const options: SequelizeOptions = {
    dialect: 'postgres',
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
    logging: process.env.DEBUG_SQL === 'true' ? console.log : false,
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
}

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, options)
    : new Sequelize({
        ...options,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'spotify_analytics',
    })

export const connectDB = async (): Promise<void> => {
    try {
        await sequelize.authenticate()
        console.log('✅ PostgreSQL connected successfully')


    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error)
        throw error
    }
}

export { sequelize }
export default sequelize
