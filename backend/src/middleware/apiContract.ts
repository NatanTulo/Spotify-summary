import type { RequestHandler } from 'express'
import { z } from 'zod'

const positive = z.string().regex(/^[1-9]\d*$/).refine(v => Number.isSafeInteger(Number(v)) && Number(v) <= 2_147_483_647)
const nonNegative = z.string().regex(/^\d+$/).refine(v => Number.isSafeInteger(Number(v)))
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => v.slice(0, 4) !== '0000' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v)
const querySchema = z.object({
    profileId: z.union([positive, z.literal('all')]).optional(),
    page: positive.pipe(z.string().refine(v => Number(v) <= 1_000_000)).optional(),
    limit: positive.pipe(z.string().refine(v => Number(v) <= 1000)).optional(),
    offset: nonNegative.pipe(z.string().refine(v => Number(v) <= 10_000_000)).optional(),
    days: positive.pipe(z.string().refine(v => Number(v) <= 3660)).optional(),
    minPlays: nonNegative.optional(),
    search: z.string().max(500).optional(),
    country: z.string().max(255).optional(), platform: z.string().max(255).optional(),
    dateFrom: date.optional(), dateTo: date.optional(),
    compareFrom: date.optional(), compareTo: date.optional(),
    sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
    order: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
    sortBy: z.enum(['id', 'name', 'trackName', 'artist', 'artistName', 'albumName', 'totalPlays', 'totalMinutes', 'avgPlayDuration', 'skipPercentage', 'firstPlay', 'lastPlay', 'plays', 'minutes', 'time', 'lastPlayed']).optional(),
    period: z.enum(['day', 'week', 'month', 'year']).optional(),
    showSkipped: z.enum(['true', 'false']).optional(), showShuffle: z.enum(['true', 'false']).optional(),
    _t: nonNegative.optional(),
}).strict().refine(q => !q.dateFrom || !q.dateTo || q.dateFrom <= q.dateTo, 'Invalid date range')
    .refine(q => !q.compareFrom || !q.compareTo || q.compareFrom <= q.compareTo, 'Invalid comparison range')
    .refine(q => Boolean(q.compareFrom) === Boolean(q.compareTo), 'Provide both comparison dates')

export const validateApi: RequestHandler = (req, res, next) => {
    const parsed = querySchema.safeParse(req.query)
    const numericIds = req.path.match(/\/(?:tracks|shows|episodes|audiobook|episode)\/([^/]+)/g) || []
    const badId = numericIds.some(segment => !positive.safeParse(segment.split('/').pop()).success)
    const audiobookProfile = req.path.match(/^\/audiobooks\/([^/]+)/)?.[1]
    const podcastProfile = req.path.match(/^\/podcasts\/([^/]+)\/episode\//)?.[1]
    const badProfile = [audiobookProfile, podcastProfile].some(id => id && id !== 'all' && !positive.safeParse(id).success)
    const debugId = req.path.match(/^\/import\/debug\/data\/([^/]+)/)?.[1]
    const profileName = req.path.match(/^\/import\/(?:profile|progress)\/([^/]+)/)?.[1]
    const badName = profileName && (!profileName.trim() || profileName.length > 255 || /[\\/\u0000-\u001f]/.test(profileName) || ['.', '..'].includes(profileName))
    const badDelete = req.path === '/import/clear' && !positive.safeParse(req.query.profileId).success
    if (!parsed.success || badId || badProfile || badName || badDelete || (debugId && !positive.safeParse(debugId).success)) {
        res.status(400).json({ success: false, code: 'INVALID_QUERY', error: 'Invalid query parameters' })
        return
    }
    next()
}

export const validateBody: RequestHandler = (req, res, next) => {
    if (req.body !== undefined && !z.object({}).strict().safeParse(req.body).success) {
        res.status(400).json({ success: false, code: 'INVALID_BODY', error: 'This endpoint does not accept body fields' })
        return
    }
    next()
}

// Keep legacy nested pagination while exposing one stable envelope to clients.
export const apiContract: RequestHandler = (req, res, next) => {
    const json = res.json.bind(res)
    res.json = (body: unknown) => {
        if (body && typeof body === 'object') {
            const payload = body as Record<string, unknown>
            if (payload.success === false) {
                const code = typeof payload.code === 'string' ? payload.code : `HTTP_${res.statusCode}`
                return json({ success: false, code, error: res.statusCode >= 500 ? 'Internal server error' : payload.message || payload.error || 'Request failed' })
            }
            const data = payload.data as Record<string, unknown> | undefined
            const nested = (payload.pagination || data?.pagination) as Record<string, number> | undefined
            if (nested) {
                const limit = nested.limit || Number(req.query.limit) || 20
                payload.pagination = { page: nested.page || nested.current || 1, limit, total: nested.total || 0, pages: nested.pages || Math.ceil((nested.total || 0) / limit) }
            } else if (data && typeof data.total === 'number' && typeof data.limit === 'number') {
                const limit = Number(data.limit)
                payload.pagination = { page: Math.floor(Number(data.offset || 0) / limit) + 1, limit, total: data.total, pages: Math.ceil(data.total / limit) }
            }
        }
        return json(body)
    }
    next()
}
