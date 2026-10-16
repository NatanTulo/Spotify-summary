import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import tracksRouter from './tracks.js'
import albumsRouter from './albums.js'

const { query } = vi.hoisted(() => ({
    query: vi.fn<(sql: string, options?: { replacements?: Record<string, unknown> }) => Promise<unknown[]>>(),
}))
vi.mock('../../config/database.js', () => ({ sequelize: { query } }))
vi.mock('../../models/music/Track.js', () => ({ Track: {} }))
vi.mock('../../models/music/Album.js', () => ({ Album: {} }))
vi.mock('../../models/music/Artist.js', () => ({ Artist: {} }))
vi.mock('../../models/music/Play.js', () => ({ Play: {} }))
vi.mock('../../models/common/Profile.js', () => ({ Profile: {} }))

let server: Server
let baseUrl: string

beforeAll(async () => {
    const app = express()
    app.use('/tracks', tracksRouter)
    app.use('/albums', albumsRouter)
    await new Promise<void>((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve())
    })
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
})

beforeEach(() => {
    query.mockReset()
    query.mockResolvedValue([])
})

describe.each(['/tracks', '/albums'])('%s list security', route => {
    it('keeps search text out of SQL in both the list and count queries', async () => {
        const search = "O'Connor%' OR 1=1; --"
        const response = await fetch(`${baseUrl}${route}?${new URLSearchParams({ search, profileId: '7', page: '2', limit: '10', sortOrder: 'asc' })}`)
        expect(response.status).toBe(200)
        expect(query).toHaveBeenCalledTimes(2)
        for (const [sql, options] of query.mock.calls) {
            expect(sql).not.toContain(search)
            expect(sql).toContain('ILIKE :search')
            expect(options?.replacements).toMatchObject({ search: `%${search}%` })
        }
        expect(query.mock.calls[0][1]?.replacements).toMatchObject({ profileId: 7, limit: 10, offset: 10 })
        expect(query.mock.calls[0][0]).toContain(' ASC')
    })

    it.each([
        ['sortOrder', 'DESC; DROP TABLE plays; --'],
        ['page', '-1'],
        ['limit', '10000000'],
        ['profileId', '7 OR 1=1'],
        ['search', 'x'.repeat(501)],
    ])('rejects invalid %s before querying the database', async (key, value) => {
        const response = await fetch(`${baseUrl}${route}?${new URLSearchParams({ [key]: value })}`)
        expect(response.status).toBe(400)
        expect(query).not.toHaveBeenCalled()
    })

    it('preserves default pagination and the all-profiles option', async () => {
        const response = await fetch(`${baseUrl}${route}?profileId=all`)
        expect(response.status).toBe(200)
        const body = await response.json() as { pagination: { page: number; limit: number } }
        expect(body.pagination).toMatchObject({ page: 1, limit: 20 })
        expect(query.mock.calls[0][1]?.replacements).toMatchObject({ profileId: null })
    })

    it('rejects repeated search parameters', async () => {
        const response = await fetch(`${baseUrl}${route}?search=a&search=b`)
        expect(response.status).toBe(400)
        expect(query).not.toHaveBeenCalled()
    })
})

describe('Track filters', () => {
    it('applies profile, play filters and minimum count to both queries', async () => {
        const params = new URLSearchParams({
            profileId: '7', minPlays: '5', country: 'PL', platform: "test' OR 1=1 --",
            dateFrom: '2026-10-01', dateTo: '2026-10-14', showSkipped: 'true', showShuffle: 'true',
        })
        const response = await fetch(`${baseUrl}/tracks?${params}`)
        expect(response.status).toBe(200)
        for (const [sql, options] of query.mock.calls) {
            expect(sql).toContain('"profileId" = :profileId')
            expect(sql).toContain('"country" = :country')
            expect(sql).toContain('"platform" = :platform')
            expect(sql).toContain('CAST(:dateFrom AS date)')
            expect(sql).toContain("CAST(:dateTo AS date) + INTERVAL '1 day'")
            expect(sql).toContain('"skipped" = true')
            expect(sql).toContain('"shuffle" = true')
            expect(sql).toContain('p.total_plays >= :minPlays')
            expect(sql).not.toContain("test' OR 1=1 --")
            expect(options?.replacements).toMatchObject({ profileId: 7, minPlays: 5, country: 'PL', dateTo: '2026-10-14' })
        }
    })

    it.each([
        'dateFrom=2026-02-30', 'dateTo=invalid', 'minPlays=-1',
        'dateFrom=2026-10-15&dateTo=2026-10-01', 'showSkipped=invalid',
    ])('rejects invalid filter %s', async params => {
        const response = await fetch(`${baseUrl}/tracks?${params}`)
        expect(response.status).toBe(400)
        expect(query).not.toHaveBeenCalled()
    })

    it.each([
        ['trackName', 't.name'], ['artistName', 'ar.name'],
        ['avgPlayDuration', 'p.avg_play_duration'], ['skipPercentage', 'p.skip_percentage'],
    ])('supports the UI sorting option %s', async (sortBy, column) => {
        const response = await fetch(`${baseUrl}/tracks?sortBy=${sortBy}&sortOrder=asc`)
        expect(response.status).toBe(200)
        expect(query.mock.calls[0][0]).toContain(`ORDER BY ${column} ASC`)
    })
})

it('applies album filters and the same minimum count to pagination', async () => {
    const response = await fetch(`${baseUrl}/albums?profileId=7&minPlays=5&country=PL&dateFrom=2026-10-01&dateTo=2026-10-14`)
    expect(response.status).toBe(200)
    for (const [sql, options] of query.mock.calls) {
        expect(sql).toContain('"country" = :country')
        expect(sql).toContain('p."profileId" = :profileId')
        expect(sql).toContain('COUNT(p.id) >= :minPlays')
        expect(options?.replacements).toMatchObject({ minPlays: 5, country: 'PL', profileId: 7 })
    }
})
