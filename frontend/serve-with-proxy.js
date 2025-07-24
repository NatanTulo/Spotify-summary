import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Proxy dla API requestów
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    logLevel: 'silent'
}));

// Serwowanie statycznych plików z folderu dist
app.use(express.static(join(__dirname, 'dist')));

// Fallback dla React Router - wszystkie inne requesty przekieruj na index.html
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Frontend server running on http://localhost:${PORT}`);
    console.log(`🔗 API proxy: /api -> http://localhost:5000`);
});
