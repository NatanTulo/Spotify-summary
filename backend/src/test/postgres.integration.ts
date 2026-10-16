import { request as httpRequest } from 'node:http'
import type { Insights } from '../../../shared/api.js'
import 'dotenv/config'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Client } from 'pg'
import express from 'express'
import type { AddressInfo } from 'node:net'

// Always create a disposable database; never run destructive tests against DB_NAME.
const database = `spotify_maintenance_test_${Date.now()}`
const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null
const admin = new Client(url ? { connectionString: url.href } : {
    host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD, database: process.env.DB_NAME || 'spotify_analytics',
})
await admin.connect()
await admin.query(`CREATE DATABASE "${database}"`)
if (url) { url.pathname = `/${database}`; process.env.DATABASE_URL = url.href }
process.env.DB_NAME = database
process.env.DEBUG_SQL = 'false'
const { sequelize } = await import('../config/database.js')
const { migrate } = await import('../config/migrations.js')
const { default: Importer } = await import('../scripts/importData.js')
const { Play, Profile, DailyStats } = await import('../models/index.js')
const { MusicImporter } = await import('../scripts/importers/MusicImporter.js')
const { default: Progress } = await import('../utils/ImportProgressManager.js')
const { dateScope, installDateScopes } = await import('../middleware/dateScope.js')
const { validateApi, validateBody, apiContract } = await import('../middleware/apiContract.js')
const { localRequestsOnly } = await import('../middleware/localSecurity.js')
const root = path.resolve('../tmp', database)
const fixture = (name: string, day = '2026-10-01') => ({ ts: `${day}T12:00:00Z`, ms_played: 60000, master_metadata_track_name: name, master_metadata_album_artist_name: 'Test Artist', master_metadata_album_album_name: 'Test Album', conn_country: 'PL', platform: 'test' })
async function write(name: string, records: unknown[]) {
    await fs.mkdir(path.join(root, name), { recursive: true })
    await fs.writeFile(path.join(root, name, 'Streaming_History_Audio_0.json'), JSON.stringify(records))
}
let assertions = 0
function check(actual: unknown, expected: unknown, message: string) { assert.deepEqual(actual, expected, message); assertions++ }
try {
    await migrate(); await migrate()
    await write('A', [fixture('Old'), fixture('Old', '2026-09-01'),
        { ts: '2026-10-01T12:00:00Z', ms_played: 180000, episode_name: 'Episode', episode_show_name: 'Show' },
        { ts: '2026-10-01T12:00:00Z', ms_played: 60000, audiobook_title: 'Book' },
        { ts: '2026-09-01T12:00:00Z', ms_played: 60000, audiobook_title: 'Book' }])
    await write('B', [fixture('Other')])
    await new Importer(root, 'A').import(); await new Importer(root, 'B').import()
    const a = (await Profile.findOne({ where: { name: 'A' } }))!
    const b = (await Profile.findOne({ where: { name: 'B' } }))!
    const count = () => Play.count({ where: { profileId: a.id } })
    check(await count(), 2, 'initial import')
    await new Importer(root, 'A').import()
    check(await count(), 2, 'reimport replaces rather than duplicates')
    check(await Play.count({ where: { profileId: b.id } }), 1, 'other profile preserved')
    check(await DailyStats.sum('totalPlays', { where: { profileId: a.id } }), 2, 'daily aggregate matches history')
    check((await a.reload()).statistics.totalAudiobookPlays, 2, 'audiobook profile statistics')
    const oldImport = (await a.reload()).lastImport?.toISOString()
    await fs.writeFile(path.join(root, 'A', 'Streaming_History_Audio_0.json'), '[{"ts":')
    await assert.rejects(new Importer(root, 'A').import()); assertions++
    check(await count(), 2, 'malformed JSON preserves history')
    check((await a.reload()).lastImport?.toISOString(), oldImport, 'failed import preserves metadata')
    await write('A', Array.from({ length: 2001 }, () => fixture('New')))
    const original = MusicImporter.prototype.flush
    let flushes = 0
    MusicImporter.prototype.flush = async function () { await original.call(this); if (++flushes === 1) throw new Error('Injected DB-stage failure') }
    await assert.rejects(new Importer(root, 'A').import(), /Injected/); assertions++
    check(await count(), 2, 'failure after first bulk insert rolls back deletion and inserts')
    MusicImporter.prototype.flush = async function () { await original.call(this); Progress.getInstance().cancelImport('A') }
    await assert.rejects(new Importer(root, 'A').import(), /cancelled/); assertions++
    check(await count(), 2, 'cancellation rolls back history')
    check(Progress.getInstance().getProgress('A')?.status, 'cancelled', 'cancelled state retained')
    MusicImporter.prototype.flush = original
    Progress.getInstance().clearProgress('A')
    await write('A', [fixture('Old'), fixture('Old', '2026-09-01')])
    installDateScopes()
    const app = express()
    app.use(localRequestsOnly)
    app.use('/api', apiContract, validateApi, dateScope)
    app.use(express.json(), validateBody)
    app.use('/api/stats', (await import('../routes/stats.js')).default)
    app.use('/api/tracks', (await import('../routes/music/tracks.js')).default)
    app.use('/api/analytics', (await import('../routes/analytics.js')).default)
    app.use('/api/podcasts', (await import('../routes/podcasts/podcasts.js')).default)
    app.use('/api/audiobooks', (await import('../routes/audiobooks/audiobooks.js')).default)
    const server = app.listen(0, '127.0.0.1')
    await new Promise<void>(resolve => server.once('listening', resolve))
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
    try {
        const get = async <T = { totalPlays: number; totalMinutes: number }>(url: string): Promise<{ data: T }> => { const res = await fetch(base + url); check(res.status, 200, url); return await res.json() as { data: T } }
        const data = await get(`/stats/overview?profileId=${a.id}&dateFrom=2026-10-01&dateTo=2026-10-01`)
        check(data.data.totalPlays, 1, 'ORM date filter')
        check(data.data.totalMinutes, 1, 'SUM date filter')
        const tracks = await get<{ totalPlays: number }[]>(`/tracks?profileId=${a.id}&dateFrom=2026-10-01&dateTo=2026-10-01`)
        check(Number(tracks.data[0].totalPlays), 1, 'raw SQL date filter')
        const insights = await get<Insights>(`/analytics/insights?profileId=${a.id}&dateFrom=2026-10-01&dateTo=2026-10-01&compareFrom=2026-09-01&compareTo=2026-09-01`)
        check(insights.data.current.plays, 1, 'current comparison')
        check(insights.data.previous.plays, 1, 'previous comparison')
        check(insights.data.calendar[0].plays, 3, 'calendar sums all content types')
        check(insights.data.current.podcastPlays, 1, 'podcast comparison')
        check(insights.data.current.audiobookPlays, 1, 'audiobook comparison')
        const podcasts = await get<{ totalPodcastPlays: number; uniqueShows: number }>(`/podcasts/stats?profileId=${a.id}&dateFrom=2026-09-01&dateTo=2026-09-01`)
        check(Number(podcasts.data.totalPodcastPlays), 0, 'podcast ORM scoped')
        check(Number(podcasts.data.uniqueShows), 0, 'podcast raw SQL scoped')
        const books = await get<{ plays: unknown[]; pagination: { total: number } }>(`/audiobooks/${a.id}/audiobook/1/plays?dateFrom=2026-10-01&dateTo=2026-10-01`)
        check(books.data.plays.length, 1, 'audiobook plays scoped')
        check(books.data.pagination.total, 1, 'audiobook pagination count scoped')
        const emptyBooks = await get<{ audiobooks: unknown[]; pagination: { total: number } }>(`/audiobooks/${a.id}?dateFrom=2026-08-01&dateTo=2026-08-01`)
        check(emptyBooks.data.audiobooks.length, 0, 'audiobook list scoped')
        check(emptyBooks.data.pagination.total, 0, 'audiobook include count scoped')
        check(insights.data.discoveries.length, 0, 'existing artist is not a discovery')
        const responses = await Promise.all([get(`/stats/overview?profileId=${a.id}&dateFrom=2026-09-01&dateTo=2026-09-01`), get(`/stats/overview?profileId=${a.id}`)])
        check(responses.map(response => response.data.totalPlays), [1, 2], 'concurrent ranges isolated')
        check((await fetch(base + '/stats/overview?limit=-1')).status, 400, 'invalid query rejected')
        check((await fetch(base + '/tracks/abc')).status, 400, 'invalid path ID rejected')
        check((await fetch(base + '/stats/overview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"unexpected":true}' })).status, 400, 'unknown body fields rejected')
        check((await fetch(base + '/stats/overview', { headers: { Origin: 'https://evil.example' } })).status, 403, 'foreign origin rejected')
        const hostStatus = await new Promise<number | undefined>((resolve, reject) => { const request = httpRequest(base + '/stats/overview', { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode) }); request.on('error', reject); request.end() })
        check(hostStatus, 403, 'DNS rebinding host rejected')
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) }
    const { default: ProfileService } = await import('../services/profileService.js')
    process.env.SPOTIFY_DATA_DIR = root
    const { default: ImportService } = await import('../services/importService.js')
    await assert.rejects(ImportService.startImport('../outside'), /Profile not found/); assertions++
    await assert.rejects(ImportService.startImport('A/../../outside'), /Profile not found/); assertions++
    const recalculated = await ProfileService.updateProfileStats('A')
    check(recalculated.statistics.totalAudiobookPlays, 2, 'recalculation preserves audiobook statistics')
    await ProfileService.deleteProfile(String(a.id))
    check(await Play.count({ where: { profileId: b.id } }), 1, 'deletion preserves other profile')
    check(await Profile.count(), 1, 'profile with all media deleted')
    await ProfileService.clearAllProfiles()
    check(await Profile.count(), 0, 'clear all handles all media')
    if (process.env.BENCHMARK_DATA_DIR) {
        const begin = performance.now()
        await new Importer(path.resolve(process.env.BENCHMARK_DATA_DIR), 'Natan').import()
        const seconds = (performance.now() - begin) / 1000
        const profile = (await Profile.findOne({ where: { name: 'Natan' } }))!
        const plans = await sequelize.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT "trackId",COUNT(*),SUM("msPlayed") FROM plays WHERE "profileId"=${profile.id} AND timestamp >= '2026-10-01' GROUP BY "trackId"`)
        await fs.mkdir('../tmp', { recursive: true })
        await fs.writeFile('../tmp/maintenance-benchmark.json', JSON.stringify({ seconds, rssMB: process.memoryUsage().rss / 1048576, statistics: profile.statistics, plans }, null, 2))
        console.log(`FULL IMPORT: ${seconds.toFixed(2)} seconds`)
        check(profile.statistics.totalPlays, 196671, 'full source music count unchanged')
        check(profile.statistics.totalPodcastPlays, 160, 'full source podcast count unchanged')
    }
    console.log(`POSTGRES INTEGRATION: ${assertions} assertions passed`)
} finally {
    await sequelize.close()
    await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`)
    await admin.end()
    // Test fixtures are deliberately retained in ignored tmp/ for diagnosis.
}
