import analyticsRouter from './routes/analytics.js'
import { dateScope, installDateScopes } from './middleware/dateScope.js'
import { assertMigrated } from './config/migrations.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { localHost, localRequestsOnly, allowedOrigins } from './middleware/localSecurity.js'
import { apiContract, validateApi, validateBody } from './middleware/apiContract.js'
import 'reflect-metadata'
import { connectDB } from './config/database.js'
import tracksRouter from './routes/music/tracks.js'
import statsRouter from './routes/stats.js'
import artistsRouter from './routes/music/artists.js'
import albumsRouter from './routes/music/albums.js'
import importRouter from './routes/import.js'
import podcastsRouter from './routes/podcasts/podcasts.js'
import audiobooksRouter from './routes/audiobooks/audiobooks.js'

dotenv.config()

installDateScopes()
const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}))

app.use(localRequestsOnly)
app.use('/api', apiContract, validateApi, dateScope)

app.use(cors({
    origin: allowedOrigins(),
    credentials: true
}))

app.use(compression())

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '16kb' }))
app.use('/api', validateBody)


// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})

// Setup routes
function setupRoutes() {
    // API Routes
    app.use('/api/analytics', analyticsRouter)
    app.use('/api/tracks', tracksRouter)
    app.use('/api/stats', statsRouter)
    app.use('/api/artists', artistsRouter)
    app.use('/api/albums', albumsRouter)
    app.use('/api/import', importRouter)
    app.use('/api/podcasts', podcastsRouter)
    app.use('/api/audiobooks', audiobooksRouter)

    // Serve static files from frontend dist
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const frontendDistPath = path.join(__dirname, '../../frontend/dist')
    
    app.use(express.static(frontendDistPath))
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('{*splat}', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({
                success: false,
                error: 'Route not found',
                message: `Cannot ${req.method} ${req.originalUrl}`
            })
        }
        
        res.sendFile(path.join(frontendDistPath, 'index.html'))
    })

    // 404 handler - MUST be after all routes
    // app.all('*', (req, res) => {
    //     res.status(404).json({
    //         success: false,
    //         error: 'Route not found',
    //         message: `Cannot ${req.method} ${req.originalUrl}`
    //     })
    // })

    // Error handling middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('Error:', err)

        res.status(err.status || 500).json({
            success: false,
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        })
    })
}

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDB()
        await assertMigrated()
        console.log('✅ Connected to PostgreSQL')

        // Setup routes
        setupRoutes()
        console.log('✅ Routes configured')

        // Start listening
        const port = parseInt(PORT.toString(), 10)
        const origins = allowedOrigins()
        
        app.listen(port, localHost, () => {
            console.log(`🚀 Server running on port ${port}`)
            console.log(`📊 API available at http://localhost:${port}/api`)
            console.log(`🌐 Local access only: http://127.0.0.1:${port}/api`)
            console.log(`🔍 Health check: http://localhost:${port}/api/health`)
            console.log(`🔒 Allowed CORS origins:`)
            origins.forEach(origin => console.log(`   - ${origin}`))
        })
    } catch (error) {
        console.error('❌ Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
