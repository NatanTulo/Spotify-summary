import { describe, expect, it, vi } from 'vitest'
import express from 'express'
import type { AddressInfo } from 'node:net'
import { Op } from 'sequelize'
import router from './audiobooks.js'

const { findAndCountAll } = vi.hoisted(() => ({ findAndCountAll: vi.fn().mockResolvedValue({ rows: [], count: 0 }) }))
vi.mock('../../models/index.js', () => ({ Audiobook: { findAndCountAll }, AudiobookPlay: {}, Profile: {} }))

describe('Audiobook search', () => {
    it('searches the supported name field and returns an empty result normally', async () => {
        const app = express()
        app.use(router)
        const server = app.listen(0, '127.0.0.1')
        await new Promise<void>(resolve => server.once('listening', resolve))
        try {
            const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/1?search=test`)
            expect(response.status).toBe(200)
            const body = await response.json() as { data: { isEmpty: boolean } }
            expect(body.data.isEmpty).toBe(true)
            expect(findAndCountAll.mock.calls[0][0].where).toEqual({ name: { [Op.iLike]: '%test%' } })
        } finally {
            await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
        }
    })
})
