import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import router from './stats.js'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../config/database.js', () => ({ sequelize: { query } }))
vi.mock('../models/music/Play.js', () => ({ Play: {} }))
vi.mock('../models/podcasts/PodcastPlay.js', () => ({ PodcastPlay: {} }))
vi.mock('../middleware/dateScope.js', () => ({ scopedOptions: vi.fn(), scopeSql: vi.fn() }))
let server: Server
let url: string
beforeAll(async () => {
    const app = express()
    app.use(router)
    await new Promise<void>((resolve, reject) => { server = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve()) })
    url = 'http://127.0.0.1:' + (server.address() as AddressInfo).port
})
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) })
beforeEach(() => { query.mockReset() })
describe('Library date bounds', () => {
    it('includes all media and preserves full-library bounds while viewing a filtered date range', async () => {
        query.mockResolvedValue([{ first: '2020-01-01', last: '2025-12-01', years: [2025, 2020] }])
        const response = await fetch(url + '/library-range?profileId=7&dateFrom=2025-01-01')
        expect(response.status).toBe(200)
        const body = await response.json() as { data: { years: number[] } }
        expect(body.data.years).toEqual([2025, 2020])
        const [sql, options] = query.mock.calls[0]
        expect(sql).toContain('podcast_plays')
        expect(sql).toContain('audiobook_plays')
        expect(sql).not.toContain('2025-01-01')
        expect(options.replacements).toEqual({ profileId: '7' })
    })
    it('returns null bounds and no years for an empty library', async () => {
        query.mockResolvedValue([{ first: null, last: null, years: null }])
        const response = await fetch(url + '/library-range?profileId=all')
        const body = await response.json() as { data: unknown }
        expect(body.data).toEqual({ first: null, last: null, years: [] })
        expect(query.mock.calls[0][0]).not.toContain('WHERE "profileId"')
    })
})
