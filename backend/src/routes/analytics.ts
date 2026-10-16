import { Router } from 'express'
import { QueryTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import type { PeriodSummary, DateRange, Insights, CalendarDay, ArtistDiscovery } from '../../../shared/api.js'

const router: Router = Router()
const iso = (date: Date) => date.toISOString().slice(0, 10)
const shift = (day: string, days: number) => iso(new Date(Date.parse(`${day}T00:00:00Z`) + days * 86400000))
const profileWhere = '(:profileId::integer IS NULL OR p."profileId" = :profileId::integer)'
const inRange = 'p.timestamp >= :dateFrom::date AND p.timestamp < (:dateTo::date + interval \'1 day\')'

async function summary(range: DateRange, profileId: number | null): Promise<PeriodSummary> {
    const replacements = { ...range, profileId }
    const [music] = await sequelize.query<Record<string, string>>(`SELECT COUNT(*) AS plays, COALESCE(SUM(p."msPlayed"),0)/60000.0 AS minutes,
        COUNT(DISTINCT p."trackId") AS tracks, COUNT(DISTINCT a."artistId") AS artists, COUNT(DISTINCT t."albumId") AS albums
        FROM plays p JOIN tracks t ON t.id=p."trackId" JOIN albums a ON a.id=t."albumId"
        WHERE ${profileWhere} AND ${inRange}`, { replacements, type: QueryTypes.SELECT })
    const other = await Promise.all(['podcast_plays', 'audiobook_plays'].map(table => sequelize.query<{ plays: string; minutes: string }>(
        `SELECT COUNT(*) AS plays, COALESCE(SUM(p."msPlayed"),0)/60000.0 AS minutes FROM ${table} p WHERE ${profileWhere} AND ${inRange}`,
        { replacements, type: QueryTypes.SELECT })))
    return {
        plays: Number(music.plays), minutes: Math.round(Number(music.minutes)), tracks: Number(music.tracks), artists: Number(music.artists), albums: Number(music.albums),
        podcastPlays: Number(other[0][0].plays), podcastMinutes: Math.round(Number(other[0][0].minutes)),
        audiobookPlays: Number(other[1][0].plays), audiobookMinutes: Math.round(Number(other[1][0].minutes)),
    }
}

router.get('/insights', async (req, res, next) => {
    try {
        const profileId = req.query.profileId && req.query.profileId !== 'all' ? Number(req.query.profileId) : null
        const today = iso(new Date())
        const dateTo = String(req.query.dateTo || (req.query.dateFrom && String(req.query.dateFrom) > today ? req.query.dateFrom : today))
        const dateFrom = String(req.query.dateFrom || shift(dateTo, -29))
        const days = Math.round((Date.parse(dateTo) - Date.parse(dateFrom)) / 86400000) + 1
        const currentRange = { dateFrom, dateTo }
        const previousRange = { dateFrom: String(req.query.compareFrom || shift(dateFrom, -days)), dateTo: String(req.query.compareTo || shift(dateFrom, -1)) }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(previousRange.dateFrom) || previousRange.dateFrom.startsWith('0000')) {
            res.status(400).json({ success: false, code: 'INVALID_COMPARISON', error: 'Comparison period is outside supported dates' })
            return
        }
        const replacements = { ...currentRange, profileId }
        const [current, previous, calendar, discoveries] = await Promise.all([
            summary(currentRange, profileId), summary(previousRange, profileId),
            sequelize.query<CalendarDay>(`SELECT to_char(p.timestamp AT TIME ZONE 'UTC','YYYY-MM-DD') AS date, COUNT(*)::integer AS plays,
                ROUND(SUM(p."msPlayed")/60000.0)::integer AS minutes FROM (
                SELECT "profileId",timestamp,"msPlayed" FROM plays UNION ALL SELECT "profileId",timestamp,"msPlayed" FROM podcast_plays
                UNION ALL SELECT "profileId",timestamp,"msPlayed" FROM audiobook_plays) p WHERE ${profileWhere} AND ${inRange}
                GROUP BY 1 ORDER BY 1`, { replacements, type: QueryTypes.SELECT }),
            sequelize.query<ArtistDiscovery>(`WITH first_plays AS (
                SELECT ar.id, ar.name, MIN(p.timestamp) AS first_played, COUNT(*)::integer AS plays
                FROM plays p JOIN tracks t ON t.id=p."trackId" JOIN albums a ON a.id=t."albumId" JOIN artists ar ON ar.id=a."artistId"
                WHERE ${profileWhere} GROUP BY ar.id,ar.name)
                SELECT id,name,to_char(first_played AT TIME ZONE 'UTC','YYYY-MM-DD') AS "firstPlayed", plays FROM first_plays
                WHERE first_played >= :dateFrom::date AND first_played < (:dateTo::date + interval '1 day')
                ORDER BY first_played DESC,id LIMIT 30`, { replacements, type: QueryTypes.SELECT }),
        ])
        const data: Insights = { current, previous, currentRange, previousRange, calendar, discoveries }
        res.json({ success: true, data })
    } catch (error) { next(error) }
})
export default router
