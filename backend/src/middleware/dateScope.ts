import { AsyncLocalStorage } from 'node:async_hooks'
import type { RequestHandler } from 'express'
import { Op, type Model, type ModelStatic, type FindOptions, type IncludeOptions } from 'sequelize'
import { sequelize } from '../config/database.js'
import { Play } from '../models/music/Play.js'
import { PodcastPlay } from '../models/podcasts/PodcastPlay.js'
import { AudiobookPlay } from '../models/audiobooks/AudiobookPlay.js'

interface Range { dateFrom?: string; dateTo?: string }
const scope = new AsyncLocalStorage<Range>()
export const dateScope: RequestHandler = (req, _res, next) => {
    const range = { dateFrom: req.query.dateFrom as string | undefined, dateTo: req.query.dateTo as string | undefined }
    scope.run(req.method === 'GET' && !req.path.startsWith('/analytics') ? range : {}, next)
}

export function constrain(options: FindOptions): void {
    const range = scope.getStore()
    if (!range?.dateFrom && !range?.dateTo) return
    const timestamp = {
        ...(range.dateFrom && { [Op.gte]: new Date(`${range.dateFrom}T00:00:00Z`) }),
        ...(range.dateTo && { [Op.lt]: new Date(Date.parse(`${range.dateTo}T00:00:00Z`) + 86400000) }),
    }
    options.where = { [Op.and]: [options.where || {}, { timestamp }] }
}
export function scopedOptions<T extends FindOptions>(options: T): T { constrain(options); return options }
export function installDateScopes(): void {
    for (const model of [Play, PodcastPlay, AudiobookPlay] as ModelStatic<Model>[]) {
        model.addHook('beforeFind', 'requestDateRange', constrain)
        model.addHook('beforeCount', 'requestDateRange', constrain)
    }
    const constrainIncludes = (options: FindOptions) => {
        function visit(includes: FindOptions['include']): void {
            for (const include of (Array.isArray(includes) ? includes : includes ? [includes] : [])) {
                if (!include || typeof include !== 'object' || !('model' in include)) continue
                const node = include as IncludeOptions
                if (node.model && ['Play', 'PodcastPlay', 'AudiobookPlay'].includes(node.model.name)) constrain(node)
                visit(node.include)
            }
        }
        visit(options.include)
    }
    sequelize.addHook('beforeFind', 'nestedRequestDateRange', constrainIncludes)
    sequelize.addHook('beforeCount', 'nestedRequestDateRange', constrainIncludes)
}

// Explicit SQL counterpart to the ORM hooks. CTEs scope every reference, including subqueries.
// Fixed table names and escaped validated dates; original query replacements are preserved.
export function scopeSql(sql: string): string {
    const range = scope.getStore()
    if (!range?.dateFrom && !range?.dateTo) return sql
    const clauses = [
        range.dateFrom && `"timestamp" >= ${sequelize.escape(`${range.dateFrom}T00:00:00Z`)}::timestamptz`,
        range.dateTo && `"timestamp" < (${sequelize.escape(range.dateTo)}::date + interval '1 day')::timestamptz`,
    ].filter(Boolean).join(' AND ')
    const ctes = ['plays', 'podcast_plays', 'audiobook_plays'].map(table => `"${table}" AS NOT MATERIALIZED (SELECT * FROM public."${table}" WHERE ${clauses})`).join(', ')
    return /^\s*WITH\b/i.test(sql) ? sql.replace(/^\s*WITH\b/i, `WITH ${ctes},`) : `WITH ${ctes} ${sql}`
}
