import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { Client } from 'pg'
import { sequelize } from '../config/database.js'

const config = { host: sequelize.config.host || 'localhost', port: Number(sequelize.config.port || 5432), username: sequelize.config.username || 'postgres', password: sequelize.config.password || '', database: sequelize.config.database || 'spotify_analytics' }
const env = { ...process.env, PGPASSWORD: config.password || '' }
const connectionArgs = ['--host', config.host, '--port', String(config.port), '--username', config.username, '--no-password']
const bin = process.env.PG_BIN || (process.platform === 'win32' ? 'C:/Program Files/PostgreSQL/18/bin' : '')
function run(name: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(bin ? path.join(bin, name) : name, args, { env, windowsHide: true, stdio: 'inherit' })
        child.on('error', reject)
        child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${name} exited with code ${code}`)))
    })
}

const [command = 'backup', fileArg, target] = process.argv.slice(2)
try {
    if (command === 'backup') {
        const file = path.resolve(fileArg || `../.local/backups/spotify-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        if (fs.existsSync(file)) throw new Error('Backup file already exists')
        await run('pg_dump', [...connectionArgs, '--format=custom', '--no-owner', '--no-privileges', '--file', file, config.database])
        fs.chmodSync(file, 0o600)
        console.log(`Backup saved: ${file}`)
    } else if (command === 'restore') {
        if (!fileArg || !target || !/^[a-z][a-z0-9_]{0,62}$/.test(target) || target === config.database) throw new Error('Usage: db:backup restore <dump> <NEW_database>; restoring over the configured database is forbidden')
        const admin = new Client({ host: config.host, port: config.port, user: config.username, password: config.password, database: config.database })
        await admin.connect()
        try {
            const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [target])
            if (existing.rowCount) throw new Error('Restore requires a new database name')
            await admin.query(`CREATE DATABASE "${target}"`)
        } finally { await admin.end() }
        await run('pg_restore', [...connectionArgs, '--no-owner', '--no-privileges', '--exit-on-error', '--dbname', target, path.resolve(fileArg)])
        console.log(`Restored into ${target}. Original database unchanged.`)
    } else throw new Error('Expected backup or restore')
} catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 }
finally { await sequelize.close() }
