import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import 'reflect-metadata'
import { connectDB } from './config/database.js'
import tracksRouter from './routes/tracks.js'
import statsRouter from './routes/stats.js'
import artistsRouter from './routes/artists.js'
import albumsRouter from './routes/albums.js'
import importRouter from './routes/import.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
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

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

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
    app.use('/api/tracks', tracksRouter)
    app.use('/api/stats', statsRouter)
    app.use('/api/artists', artistsRouter)
    app.use('/api/albums', albumsRouter)
    app.use('/api/import', importRouter)

    // Serve static files from frontend dist
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const frontendDistPath = path.join(__dirname, '../../frontend/dist')
    
    app.use(express.static(frontendDistPath))
    
    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (req, res) => {
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
            error: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        })
    })
}

// Start server
async function startServer() {
    try {
        // Connect to database
        await connectDB()
        console.log('✅ Connected to PostgreSQL')

        // Setup routes
        setupRoutes()
        console.log('✅ Routes configured')

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`)
            console.log(`📊 API available at http://localhost:${PORT}/api`)
            console.log(`🔍 Health check: http://localhost:${PORT}/api/health`)
        })
    } catch (error) {
        console.error('❌ Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
