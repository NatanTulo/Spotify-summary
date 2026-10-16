export class InvalidListQueryError extends Error {}

function positiveInteger(value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
    if (value === undefined) return fallback
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
        throw new InvalidListQueryError('Expected a positive integer')
    }
    const parsed = Number(value)
    if (!Number.isSafeInteger(parsed) || parsed > max) {
        throw new InvalidListQueryError('Query parameter exceeds the allowed range')
    }
    return parsed
}

export function parseListQuery(query: Record<string, unknown>) {
    const pageNum = positiveInteger(query.page, 1, 1_000_000)
    const limitNum = positiveInteger(query.limit, 20, 1000)
    const profileIdNum = query.profileId === undefined || query.profileId === 'all'
        ? null
        : positiveInteger(query.profileId, 1)
    const search = query.search ?? ''
    if (typeof search !== 'string' || search.length > 500) {
        throw new InvalidListQueryError('Search must be a string of at most 500 characters')
    }
    const sortOrder = typeof query.sortOrder === 'string' ? query.sortOrder.toUpperCase() : query.sortOrder ?? 'DESC'
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
        throw new InvalidListQueryError('Sort order must be ASC or DESC')
    }
    return { pageNum, limitNum, profileIdNum, search, sortOrder }
}
