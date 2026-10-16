import { afterEach, describe, expect, it } from 'vitest'
import { scopedUrl, setRequestRange } from './api'

afterEach(() => setRequestRange({ dateFrom: '', dateTo: '' }))

describe('Independent analysis ranges', () => {
    it('lets chart rankings override the global period without changing it', () => {
        setRequestRange({ dateFrom: '2025-01-01', dateTo: '2025-12-31' })
        const ranking = new URL(scopedUrl('/api/tracks?profileId=7', { dateFrom: '2025-03-01', dateTo: '2025-03-31' }), 'http://localhost')
        expect(ranking.searchParams.get('profileId')).toBe('7')
        expect(ranking.searchParams.get('dateFrom')).toBe('2025-03-01')
        expect(ranking.searchParams.get('dateTo')).toBe('2025-03-31')
        expect(scopedUrl('/api/stats/overview')).toContain('dateTo=2025-12-31')
    })
    it('fetches a complete calendar year despite a narrow global period', () => {
        setRequestRange({ dateFrom: '2026-09-17', dateTo: '2026-10-16' })
        const url = scopedUrl('/api/analytics/calendar?profileId=1', { dateFrom: '2024-01-01', dateTo: '2024-12-31' })
        expect(url).toContain('dateFrom=2024-01-01')
        expect(url).toContain('dateTo=2024-12-31')
        expect(url).not.toContain('2026')
    })
    it('can explicitly request unfiltered data and always leaves library bounds unscoped', () => {
        setRequestRange({ dateFrom: '2026-01-01', dateTo: '2026-12-31' })
        expect(scopedUrl('/api/stats/overview?dateFrom=2025-01-01', { dateFrom: '', dateTo: '' })).toBe('/api/stats/overview')
        expect(scopedUrl('/api/stats/library-range?profileId=all')).toBe('/api/stats/library-range?profileId=all')
    })
})
