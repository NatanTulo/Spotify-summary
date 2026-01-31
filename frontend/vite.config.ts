import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { networkInterfaces } from 'os'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Funkcja do automatycznego wykrywania lokalnego IP
function getLocalNetworkIP(): string {
    const nets = networkInterfaces()
    
    for (const name of Object.keys(nets)) {
        const netInfo = nets[name]
        if (!netInfo) continue
        
        for (const net of netInfo) {
            // Pomiń interfejsy niebędące IPv4 i wewnętrzne (loopback)
            if (net.family === 'IPv4' && !net.internal) {
                return net.address
            }
        }
    }
    
    // Fallback do localhost jeśli nie znajdzie IP sieciowego
    return 'localhost'
}

const localIP = getLocalNetworkIP()
console.log(`🌐 Używając lokalnego IP dla proxy: ${localIP}`)

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3000,
        host: '0.0.0.0', // Nasłuchuj na wszystkich interfejsach sieciowych
        proxy: {
            '/api': {
                target: `http://${localIP}:5000`, // Automatyczne wykrywanie lokalnego IP
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        // Zwiększ limit ostrzeżenia do 1MB (dla głównego chunk'a)
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor libraries - największe zależności
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-ui': ['@radix-ui/react-progress', '@radix-ui/react-tabs', '@radix-ui/react-slot'],
                    'vendor-charts': ['recharts'],
                    'vendor-utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
                    
                    // Komponenty aplikacji - największe strony
                    'components-charts': [
                        './src/components/charts/PlaysByCountryChart.tsx',
                        './src/components/charts/YearlyStatsChart.tsx',
                        './src/components/charts/TopArtistsChart.tsx',
                        './src/components/charts/ListeningTimelineChart.tsx'
                    ],
                    'components-tracks': ['./src/components/TracksList.tsx'],
                    'pages': [
                        './src/pages/Dashboard.tsx',
                        './src/pages/music/Analytics.tsx',
                        './src/pages/podcasts/Podcasts.tsx',
                        './src/pages/audiobooks/Audiobooks.tsx'
                    ],
                }
            }
        }
    }
})
