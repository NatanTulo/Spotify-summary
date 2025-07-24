import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

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
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
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
                    'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-progress', '@radix-ui/react-select', '@radix-ui/react-tabs'],
                    'vendor-charts': ['recharts'],
                    'vendor-utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
                    
                    // Komponenty aplikacji - największe strony
                    'components-charts': ['./src/components/charts/StatsCharts.tsx'],
                    'components-tracks': ['./src/components/TracksList.tsx', './src/components/TracksListNew.tsx'],
                    'pages': ['./src/pages/Dashboard.tsx', './src/pages/Analytics.tsx'],
                }
            }
        }
    }
})
