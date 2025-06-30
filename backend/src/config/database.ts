import mongoose from 'mongoose'

export const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spotify-analytics'

        await mongoose.connect(mongoURI)

        console.log(`✅ MongoDB connected: ${mongoose.connection.host}`)

        // Event listeners
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err)
        })

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected')
        })

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close()
            console.log('💤 MongoDB connection closed through app termination')
            process.exit(0)
        })

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error)
        process.exit(1)
    }
}
