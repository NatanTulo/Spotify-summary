import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { Client } from 'pg'
import { createServer } from 'node:net'

const database = `spotify_browser_test_${Date.now()}`
const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null
const admin = new Client(url ? { connectionString: url.href } : { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD, database: process.env.DB_NAME || 'spotify_analytics' })
await admin.connect()
await admin.query(`CREATE DATABASE "${database}"`)
if (url) { url.pathname = `/${database}`; process.env.DATABASE_URL = url.href }
process.env.DB_NAME = database
process.env.NODE_ENV = 'test'
const { sequelize } = await import('../config/database.js')
const { migrate } = await import('../config/migrations.js')
const root = path.resolve('..')
const dataDir = path.join(root, 'tmp', database)
let server: ReturnType<typeof spawn> | undefined
try {
    const probe = createServer()
    await new Promise<void>((resolve, reject) => { probe.once('error', reject); probe.listen(5107, '127.0.0.1', resolve) })
    await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()))
    await migrate()
    await fs.mkdir(path.join(dataDir, 'E2E'), { recursive: true })
    const record = (name: string, date: string) => ({ ts: `${date}T12:00:00Z`, ms_played: 60000, master_metadata_track_name: name, master_metadata_album_artist_name: 'Browser Artist', master_metadata_album_album_name: 'Browser Album' })
    await fs.writeFile(path.join(dataDir, 'E2E', 'Streaming_History_Audio_0.json'), JSON.stringify([record('Needle', '2026-10-01'), record('Needle', '2026-10-01'), record('Different', '2026-09-01'), record('Archive', '2024-03-15')]))
    const log = await fs.open(path.join(dataDir, 'server.log'), 'w')
    server = spawn(process.execPath, ['dist/index.js'], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: 'production', PORT: '5107', SPOTIFY_DATA_DIR: dataDir }, windowsHide: true, stdio: ['ignore', log.fd, log.fd] })
    let ready = false
    for (let i = 0; i < 100; i++) {
        try { ready = (await fetch('http://127.0.0.1:5107/api/health')).ok } catch { /* startup */ }
        if (ready) break
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (!ready) throw new Error('E2E server did not start; see tmp/spotify_browser_test_*/server.log')
    const status = await new Promise<number | null>((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test'], { cwd: root, env: { ...process.env, E2E_BASE_URL: 'http://127.0.0.1:5107' }, windowsHide: true, stdio: 'inherit' })
        child.on('error', reject); child.on('exit', resolve)
    })
    process.exitCode = status === 0 ? 0 : 1
    await log.close()
} finally {
    if (server && server.exitCode === null) {
        const exited = new Promise(resolve => server!.once('exit', resolve))
        server.kill(); await exited
    }
    await sequelize.close()
    await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`)
    await admin.end()
}
