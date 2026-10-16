import { InvalidListQueryError } from './listQuery.js'

export function parseTrackFilters(query: Record<string, unknown>) {
    const conditions: string[] = []
    const replacements: Record<string, string | number> = {}
    const minPlays = query.minPlays ?? '0'
    if (typeof minPlays !== 'string' || !/^\d+$/.test(minPlays) || !Number.isSafeInteger(Number(minPlays))) {
        throw new InvalidListQueryError('Minimum plays must be a non-negative integer')
    }
    replacements.minPlays = Number(minPlays)

    for (const key of ['country', 'platform'] as const) {
        const value = query[key]
        if (value === undefined || value === '') continue
        if (typeof value !== 'string' || value.length > 255) {
            throw new InvalidListQueryError(`Invalid ${key}`)
        }
        conditions.push(`"${key}" = :${key}`)
        replacements[key] = value
    }

    for (const key of ['dateFrom', 'dateTo'] as const) {
        const value = query[key]
        if (value === undefined || value === '') continue
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)
            || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
            throw new InvalidListQueryError(`Invalid ${key}; expected YYYY-MM-DD`)
        }
        replacements[key] = value
        conditions.push(key === 'dateFrom'
            ? 'timestamp >= CAST(:dateFrom AS date)'
            : "timestamp < CAST(:dateTo AS date) + INTERVAL '1 day'")
    }
    if (replacements.dateFrom && replacements.dateTo && replacements.dateFrom > replacements.dateTo) {
        throw new InvalidListQueryError('Start date must not be after end date')
    }

    for (const [key, column] of [['showSkipped', 'skipped'], ['showShuffle', 'shuffle']] as const) {
        const value = query[key]
        if (value === undefined || value === 'false') continue
        if (value !== 'true') throw new InvalidListQueryError(`Invalid ${key}; expected true or false`)
        conditions.push(`"${column}" = true`)
    }
    return { conditions, replacements }
}
