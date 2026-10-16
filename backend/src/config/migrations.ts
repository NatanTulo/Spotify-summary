import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { QueryTypes } from 'sequelize'
import { sequelize } from './database.js'

const directory = fileURLToPath(new URL('../../migrations/', import.meta.url))
export async function migrate(): Promise<void> {
    await sequelize.transaction(async transaction => {
        await sequelize.query('SELECT pg_advisory_xact_lock(187042602)', { transaction })
        await sequelize.query('CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())', { transaction })
        const applied = await sequelize.query<{ version: string }>('SELECT version FROM schema_migrations', { type: QueryTypes.SELECT, transaction })
        for (const file of (await fs.readdir(directory)).filter(f => f.endsWith('.sql')).sort()) {
            if (applied.some(row => row.version === file)) continue
            await sequelize.query(await fs.readFile(path.join(directory, file), 'utf8'), { transaction })
            await sequelize.query('INSERT INTO schema_migrations(version) VALUES (:version)', { replacements: { version: file }, transaction })
        }
    })
}

export async function assertMigrated(): Promise<void> {
    const files = (await fs.readdir(directory)).filter(f => f.endsWith('.sql'))
    try {
        const applied = await sequelize.query<{ version: string }>('SELECT version FROM schema_migrations', { type: QueryTypes.SELECT })
        if (files.every(file => applied.some(row => row.version === file))) return
    } catch { /* Report the actionable command rather than raw SQL. */ }
    throw new Error('Database migrations required. Run: pnpm db:migrate')
}
