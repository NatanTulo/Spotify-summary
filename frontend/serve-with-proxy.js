import { preview } from 'vite'

// Local preview of the production build. Deployment uses the backend server.
const server = await preview({
    preview: {
        host: '127.0.0.1',
        port: 3000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5000',
                changeOrigin: true,
            },
        },
    },
})

server.printUrls()
