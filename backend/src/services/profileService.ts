import { Profile } from '../models/common/Profile.js'
import { sequelize } from '../config/database.js'
import { QueryTypes } from 'sequelize'

export class ProfileService {
    async getAllProfiles() {
        const profiles = await Profile.findAll({
            order: [['createdAt', 'DESC']]
        })

        return profiles.map(profile => ({
            _id: profile.id.toString(),
            name: profile.name,
            username: profile.username,
            lastImport: profile.lastImport?.toISOString(),
            statistics: profile.statistics,
            createdAt: profile.createdAt.toISOString()
        }))
    }

    async getProfileByName(name: string) {
        return await Profile.findOne({ where: { name } })
    }

    async createOrUpdateProfile(name: string) {
        let profile = await Profile.findOne({ where: { name } })

        if (!profile) {
            profile = await Profile.create({
                name,
                statistics: {
                    totalPlays: 0,
                    totalMinutes: 0,
                    uniqueTracks: 0,
                    uniqueArtists: 0,
                    uniqueAlbums: 0
                }
            })
        }

        return profile
    }

    async updateProfileStats(profileName: string) {
        return sequelize.transaction(async transaction => {
            await sequelize.query('SELECT pg_advisory_xact_lock(187042601)', { transaction })
            const profile = await Profile.findOne({ where: { name: profileName }, transaction })
            if (!profile) throw new Error('Profile not found')
            const [row] = await sequelize.query<Record<string, string>>(`
                SELECT COUNT(*) AS "totalPlays", COALESCE(SUM(p."msPlayed"),0) AS ms,
                    COUNT(DISTINCT p."trackId") AS "uniqueTracks", COUNT(DISTINCT a."artistId") AS "uniqueArtists", COUNT(DISTINCT t."albumId") AS "uniqueAlbums"
                FROM plays p JOIN tracks t ON t.id=p."trackId" JOIN albums a ON a.id=t."albumId" WHERE p."profileId"=:id
            `, { replacements: { id: profile.id }, transaction, type: QueryTypes.SELECT })
            const [podcasts] = await sequelize.query<Record<string, string>>(`SELECT COUNT(*) AS plays,COUNT(DISTINCT p."episodeId") AS episodes, COUNT(DISTINCT e."showId") AS shows
                FROM podcast_plays p JOIN episodes e ON e.id=p."episodeId" WHERE p."profileId"=:id`, { replacements: { id: profile.id }, transaction, type: QueryTypes.SELECT })
            const [books] = await sequelize.query<Record<string, string>>(`SELECT COUNT(*) AS plays,COUNT(DISTINCT "audiobookId") AS books FROM audiobook_plays WHERE "profileId"=:id`, { replacements: { id: profile.id }, transaction, type: QueryTypes.SELECT })
            profile.statistics = {
                totalPlays: Number(row.totalPlays), totalMinutes: Math.round(Number(row.ms)/60000), uniqueTracks: Number(row.uniqueTracks), uniqueArtists: Number(row.uniqueArtists), uniqueAlbums: Number(row.uniqueAlbums),
                totalPodcastPlays: Number(podcasts.plays), uniqueShows: Number(podcasts.shows), uniqueEpisodes: Number(podcasts.episodes), totalAudiobookPlays: Number(books.plays), uniqueAudiobooks: Number(books.books),
            }
            await profile.save({ transaction })
            return { _id: String(profile.id), name: profile.name, statistics: profile.statistics, lastImport: profile.lastImport?.toISOString() }
        })
    }

    async deleteProfile(profileId: string) {
        await sequelize.transaction(async transaction => {
            await sequelize.query('SELECT pg_advisory_xact_lock(187042601)', { transaction })
            const profile = await Profile.findByPk(profileId, { transaction })
            if (!profile) throw new Error('Profile not found')
            for (const table of ['yearly_stats', 'daily_stats', 'country_stats', 'artist_stats', 'plays', 'podcast_plays', 'audiobook_plays']) {
                await sequelize.query(`DELETE FROM "${table}" WHERE "profileId"=:profileId`, { replacements: { profileId }, transaction })
            }
            await profile.destroy({ transaction })
            for (const sql of [
                'DELETE FROM tracks t WHERE NOT EXISTS (SELECT 1 FROM plays p WHERE p."trackId"=t.id)',
                'DELETE FROM albums a WHERE NOT EXISTS (SELECT 1 FROM tracks t WHERE t."albumId"=a.id)',
                'DELETE FROM artists a WHERE NOT EXISTS (SELECT 1 FROM albums b WHERE b."artistId"=a.id) AND NOT EXISTS (SELECT 1 FROM artist_stats s WHERE s."artistId"=a.id)',
                'DELETE FROM episodes e WHERE NOT EXISTS (SELECT 1 FROM podcast_plays p WHERE p."episodeId"=e.id)',
                'DELETE FROM shows s WHERE NOT EXISTS (SELECT 1 FROM episodes e WHERE e."showId"=s.id)',
                'DELETE FROM audiobooks a WHERE NOT EXISTS (SELECT 1 FROM audiobook_plays p WHERE p."audiobookId"=a.id)',
            ]) await sequelize.query(sql, { transaction })
        })
    }

    async clearAllProfiles() {
        await sequelize.transaction(async transaction => {
            await sequelize.query('SELECT pg_advisory_xact_lock(187042601)', { transaction })
            for (const table of ['yearly_stats', 'daily_stats', 'country_stats', 'artist_stats', 'plays', 'podcast_plays', 'audiobook_plays', 'tracks', 'albums', 'artists', 'episodes', 'shows', 'audiobooks', 'profiles']) {
                await sequelize.query(`DELETE FROM "${table}"`, { transaction })
            }
        })
    }

    async getDebugData(profileId: string) {
        const [playsCount] = await sequelize.query(`
            SELECT COUNT(*) as count FROM plays WHERE "profileId" = :profileId
        `, {
            replacements: { profileId },
            type: QueryTypes.SELECT
        })

        const [artistsCount] = await sequelize.query(`
            SELECT COUNT(DISTINCT artists.id) as count 
            FROM plays 
            JOIN tracks ON plays."trackId" = tracks.id
            JOIN albums ON tracks."albumId" = albums.id  
            JOIN artists ON albums."artistId" = artists.id
            WHERE plays."profileId" = :profileId
        `, {
            replacements: { profileId },
            type: QueryTypes.SELECT
        })

        const profile = await Profile.findByPk(profileId)

        return {
            profileExists: !!profile,
            playsCount: (playsCount as any)?.count || 0,
            artistsCount: (artistsCount as any)?.count || 0,
            profileStats: profile?.statistics || null
        }
    }
}

export default new ProfileService()
