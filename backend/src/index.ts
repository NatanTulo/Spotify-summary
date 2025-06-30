import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import 'reflect-metadata'
import { connectDB } from './config/database.js'
import tracksRouter from './routes/tracks.js'
// import statsRouter from './routes/stats.js'
// import artistsRouter from './routes/artists.js'
// import albumsRouter from './routes/albums.js'
// import importRouter from './routes/import.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
})
app.use(limiter)

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/tracks', tracksRouter)
// app.use('/api/stats', statsRouter)
// app.use('/api/artists', artistsRouter)
// app.use('/api/albums', albumsRouter)
// app.use('/api/import', importRouter)

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Error:', err)
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    })
})

// 404 handler
app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

async function startServer() {
    try {
        await connectDB()
        console.log('✅ Connected to MongoDB')

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`)
            console.log(`📊 API available at http://localhost:${PORT}/api`)
            if (process.env.NODE_ENV === 'development') {
                console.log(`🏥 Health check: http://localhost:${PORT}/api/health`)
            }
        })
    } catch (error) {
        console.error('❌ Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
