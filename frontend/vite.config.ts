import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 3000,
        host: '127.0.0.1', // Dostęp wyłącznie lokalny
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        // Zwiększ limit ostrzeżenia do 1MB (dla głównego chunk'a)
        chunkSizeWarningLimit: 1000,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        { name: 'vendor-charts', test: /[\\/]node_modules[\\/](recharts|@reduxjs|redux|immer|reselect|victory-vendor|d3-)[^\\/]*[\\/]/ },
                        { name: 'vendor-ui', test: /[\\/]node_modules[\\/]@radix-ui[\\/]/ },
                    ],
                },
            }
        }
    }
})
