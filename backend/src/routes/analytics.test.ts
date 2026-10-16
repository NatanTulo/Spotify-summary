import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import type { AddressInfo } from 'node:net'
import router from './analytics.js'
import type { CalendarDay, DateRange } from '../../../shared/api.js'
const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('../config/database.js', () => ({ sequelize: { query } }))
beforeEach(() => {
    query.mockReset()
    query.mockImplementation(async (sql: string, options: { replacements: { dateFrom?: string } }) => {
        if (sql.includes('MAX(p.timestamp)')) return [{ last: '2019-06-15' }]
        if (sql.includes('COUNT(DISTINCT')) return [{ plays: '2', minutes: '4', tracks: '1', artists: '1', albums: '1' }]
        if (sql.includes('SELECT COUNT(*) AS plays')) return [{ plays: '0', minutes: '0' }]
        if (sql.includes('WITH first_plays')) return []
        if (sql.includes(' AS date,')) return [{ date: `${options.replacements.dateFrom?.slice(0, 4)}-02-01`, plays: 7, minutes: 21 }]
        throw new Error(`Unexpected SQL: ${sql}`)
    })
})
async function request<T>(path: string) {
    const app = express()
    app.use(router)
    const server = app.listen(0, '127.0.0.1')
    await new Promise<void>(resolve => server.once('listening', resolve))
    try {
        const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`)
        return { status: response.status, body: await response.json() as T }
    } finally {
        await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
}
describe('Independent full-year activity calendar', () => {
    it('queries all content types for the requested UTC year and selected profile', async () => {
        const result = await request<{ data: CalendarDay[] }>('/calendar?profileId=42&dateFrom=2017-01-01&dateTo=2017-12-31')
        expect(result.status).toBe(200)
        expect(result.body.data).toEqual([{ date: '2017-02-01', plays: 7, minutes: 21 }])
        expect(query).toHaveBeenCalledOnce()
        const [sql, options] = query.mock.calls[0]
        expect(options.replacements).toEqual({ profileId: 42, dateFrom: '2017-01-01', dateTo: '2017-12-31' })
        expect(sql).toContain('FROM plays UNION ALL')
        expect(sql).toContain('FROM podcast_plays')
        expect(sql).toContain('FROM audiobook_plays')
        expect(sql).toContain("AT TIME ZONE 'UTC'")
    })
    it('rejects an incomplete calendar range rather than silently returning a single comparison month', async () => {
        const result = await request<{ code: string }>('/calendar?dateFrom=2026-09-01&dateTo=2026-09-30')
        expect(result.status).toBe(400)
        expect(result.body.code).toBe('INVALID_CALENDAR_RANGE')
        expect(query).not.toHaveBeenCalled()
    })
    it('anchors an unfiltered comparison to the latest imported date instead of the current date', async () => {
        const result = await request<{ data: { currentRange: DateRange } }>('/insights?profileId=42')
        expect(result.status).toBe(200)
        expect(result.body.data.currentRange).toEqual({ dateFrom: '2019-05-17', dateTo: '2019-06-15' })
        expect(query.mock.calls[0][1].replacements).toEqual({ profileId: 42 })
        expect(query.mock.calls[0][0]).not.toContain(':dateFrom')
    })
    it('keeps an explicit comparison range and does not replace it with library bounds', async () => {
        const result = await request<{ data: { currentRange: DateRange } }>('/insights?profileId=42&dateFrom=2026-09-01&dateTo=2026-09-30')
        expect(result.status).toBe(200)
        expect(result.body.data.currentRange).toEqual({ dateFrom: '2026-09-01', dateTo: '2026-09-30' })
        expect(query.mock.calls.some(([sql]) => sql.includes('MAX(p.timestamp)'))).toBe(false)
    })
})
