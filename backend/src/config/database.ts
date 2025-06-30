import { Sequelize } from 'sequelize-typescript'
import { Artist } from '../models/Artist'
import { Album } from '../models/Album'
import { Track } from '../models/Track'
import { Play } from '../models/Play'
import { Profile } from '../models/Profile'
import { ArtistStats } from '../models/ArtistStats'
import { CountryStats } from '../models/CountryStats'
import { DailyStats } from '../models/DailyStats'
import { YearlyStats } from '../models/YearlyStats'

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
        YearlyStats
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
            console.log('✅ Database synchronized')
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
