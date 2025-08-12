import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { networkInterfaces } from 'os'
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

// Funkcja do wykrywania lokalnych adresów IP
function getLocalNetworkAddresses() {
    const addresses = []
    const nets = networkInterfaces()
    
    for (const name of Object.keys(nets)) {
        const interfaces = nets[name]
        if (!interfaces) continue
        
        for (const net of interfaces) {
            // Pomiń interfejsy niebędące IPv4 i wewnętrzne (loopback)
            if (net.family === 'IPv4' && !net.internal) {
                addresses.push(net.address)
            }
        }
    }
    
    return addresses
}

// Tworzenie listy dozwolonych origins
function createAllowedOrigins() {
    const localAddresses = getLocalNetworkAddresses()
    const origins = [
        'http://localhost:3000'
    ]
    
    // Dodaj wszystkie lokalne adresy IP z portem 3000
    localAddresses.forEach(address => {
        origins.push(`http://${address}:3000`)
    })
    
    return origins
}

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
    origin: createAllowedOrigins(),
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
    app.use('/api/podcasts', podcastsRouter)
    app.use('/api/audiobooks', audiobooksRouter)

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
        const port = parseInt(PORT.toString(), 10)
        const allowedOrigins = createAllowedOrigins()
        
        app.listen(port, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${port}`)
            console.log(`📊 API available at http://localhost:${port}/api`)
            console.log(`🌐 Network access: http://0.0.0.0:${port}/api`)
            console.log(`🔍 Health check: http://localhost:${port}/api/health`)
            console.log(`🔒 Allowed CORS origins:`)
            allowedOrigins.forEach(origin => console.log(`   - ${origin}`))
        })
    } catch (error) {
        console.error('❌ Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
