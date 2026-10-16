import type { RequestHandler } from 'express'

export const localHost = '127.0.0.1'
const hosts = new Set(['127.0.0.1', 'localhost', '[::1]'])

export function allowedOrigins(): string[] {
    const origins = ['http://localhost:3000', 'http://127.0.0.1:3000', `http://localhost:${process.env.PORT || 5000}`, `http://127.0.0.1:${process.env.PORT || 5000}`]
    for (const origin of (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)) {
        const url = new URL(origin)
        if (!hosts.has(url.hostname) || !['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
            throw new Error('CORS_ORIGIN must contain exact loopback origins')
        }
        origins.push(origin)
    }
    return [...new Set(origins)]
}

export const localRequestsOnly: RequestHandler = (req, res, next) => {
    let hostname: string
    try { hostname = new URL(`http://${req.headers.host}`).hostname } catch { hostname = '' }
    if (!hosts.has(hostname)) {
        res.status(403).json({ success: false, code: 'INVALID_HOST', error: 'Only local hosts are allowed' })
        return
    }
    const origin = req.headers.origin
    if ((origin && !allowedOrigins().includes(origin)) || req.headers['sec-fetch-site'] === 'cross-site') {
        res.status(403).json({ success: false, code: 'INVALID_ORIGIN', error: 'Requests from external sites are not allowed' })
        return
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['content-type'] && !req.is('application/json')) {
        res.status(415).json({ success: false, code: 'JSON_REQUIRED', error: 'Use application/json' })
        return
    }
    next()
}
