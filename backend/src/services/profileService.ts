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
                lastImport: new Date(),
                statistics: {
                    totalPlays: 0,
                    totalMinutes: 0,
                    uniqueTracks: 0,
                    uniqueArtists: 0,
                    uniqueAlbums: 0
                }
            })
        } else {
            profile.lastImport = new Date()
            await profile.save()
        }

        return profile
    }

    async updateProfileStats(profileName: string) {
        const profile = await Profile.findOne({ where: { name: profileName } })
        if (!profile) {
            throw new Error('Profile not found')
        }

        console.log(`📊 Updating statistics for profile: ${profileName}`)

        const [
            totalPlays,
            totalMsPlayed,
            uniqueTracks,
            uniqueArtists,
            uniqueAlbums,
            totalPodcastPlays,
            uniqueShows,
            uniqueEpisodes
        ] = await Promise.all([
            sequelize.query(`SELECT COUNT(*) as count FROM plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`SELECT COALESCE(SUM("msPlayed"), 0) as sum FROM plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).sum)),
            sequelize.query(`SELECT COUNT(DISTINCT "trackId") as count FROM plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`
                SELECT COUNT(DISTINCT artists.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                JOIN artists ON albums."artistId" = artists.id
                WHERE plays."profileId" = :profileId
            `, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`
                SELECT COUNT(DISTINCT albums.id) as count 
                FROM plays 
                JOIN tracks ON plays."trackId" = tracks.id
                JOIN albums ON tracks."albumId" = albums.id  
                WHERE plays."profileId" = :profileId
            `, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            // Podcast stats
            sequelize.query(`SELECT COUNT(*) as count FROM podcast_plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`
                SELECT COUNT(DISTINCT shows.id) as count 
                FROM podcast_plays 
                JOIN episodes ON podcast_plays."episodeId" = episodes.id
                JOIN shows ON episodes."showId" = shows.id  
                WHERE podcast_plays."profileId" = :profileId
            `, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count)),
            sequelize.query(`SELECT COUNT(DISTINCT "episodeId") as count FROM podcast_plays WHERE "profileId" = :profileId`, {
                replacements: { profileId: profile.id },
                type: QueryTypes.SELECT
            }).then(result => parseInt((result[0] as any).count))
        ])

        await Profile.update({
            statistics: {
                totalPlays: totalPlays || 0,
                totalMinutes: Math.round((totalMsPlayed || 0) / 60000),
                uniqueTracks: uniqueTracks || 0,
                uniqueArtists: uniqueArtists || 0,
                uniqueAlbums: uniqueAlbums || 0,
                totalPodcastPlays: totalPodcastPlays || 0,
                uniqueShows: uniqueShows || 0,
                uniqueEpisodes: uniqueEpisodes || 0
            },
            lastImport: new Date()
        }, {
            where: { id: profile.id }
        })

        const updatedProfile = await Profile.findByPk(profile.id)

        console.log(`✅ Statistics updated for profile: ${profileName}`)

        return {
            _id: updatedProfile!.id.toString(),
            name: updatedProfile!.name,
            statistics: updatedProfile!.statistics,
            lastImport: updatedProfile!.lastImport?.toISOString()
        }
    }

    async deleteProfile(profileId: string) {
        const profile = await Profile.findByPk(profileId)
        if (!profile) {
            throw new Error('Profile not found')
        }

        const transaction = await sequelize.transaction()

        try {
            console.log(`🗑️ Deleting profile ${profileId} and all associated data...`)

            const tablesToClear = [
                'yearly_stats',
                'daily_stats', 
                'country_stats',
                'artist_stats',
                'podcast_plays'
            ]

            for (const table of tablesToClear) {
                const exists = await sequelize.query(
                    `SELECT to_regclass(:tbl) as oid`,
                    {
                        replacements: { tbl: table },
                        type: QueryTypes.SELECT,
                        transaction
                    }
                ).then((res: any) => res[0]?.oid !== null)
                  .catch(() => false)

                if (!exists) {
                    continue
                }

                await sequelize.query(
                    `DELETE FROM ${table} WHERE "profileId" = :profileId`,
                    { replacements: { profileId }, transaction }
                )
            }

            await sequelize.query(`
                DELETE FROM plays WHERE "profileId" = :profileId
            `, { replacements: { profileId }, transaction })

            // Clean up unused data
            try {
                await sequelize.query(`
                    DELETE FROM tracks WHERE id NOT IN (
                        SELECT DISTINCT "trackId" FROM plays WHERE "trackId" IS NOT NULL
                    )
                `, { transaction })

                await sequelize.query(`
                    DELETE FROM albums WHERE id NOT IN (
                        SELECT DISTINCT "albumId" FROM tracks WHERE "albumId" IS NOT NULL
                    )
                `, { transaction })

                await sequelize.query(`
                    DELETE FROM artists WHERE id NOT IN (
                        SELECT DISTINCT "artistId" FROM albums WHERE "artistId" IS NOT NULL
                        UNION
                        SELECT DISTINCT "artistId" FROM artist_stats WHERE "artistId" IS NOT NULL
                    )
                `, { transaction })

                await sequelize.query(`
                    DELETE FROM episodes WHERE id NOT IN (
                        SELECT DISTINCT "episodeId" FROM podcast_plays WHERE "episodeId" IS NOT NULL
                    )
                `, { transaction })

                await sequelize.query(`
                    DELETE FROM shows WHERE id NOT IN (
                        SELECT DISTINCT "showId" FROM episodes WHERE "showId" IS NOT NULL
                    )
                `, { transaction })
            } catch (err) {
                console.warn('Minor cleanup warning:', err)
            }

            await profile.destroy({ transaction })
            
            await transaction.commit()
            console.log(`✅ Deleted profile ${profileId}`)
        } catch (error) {
            await transaction.rollback()
            throw error
        }
    }

    async clearAllProfiles() {
        console.log('Clearing all data from database...')
        const transaction = await sequelize.transaction()

        try {
            await sequelize.query('DELETE FROM "yearly_stats"', { transaction })
            await sequelize.query('DELETE FROM "daily_stats"', { transaction })
            await sequelize.query('DELETE FROM "country_stats"', { transaction })
            await sequelize.query('DELETE FROM "artist_stats"', { transaction })
            await sequelize.query('DELETE FROM "plays"', { transaction })
            await sequelize.query('DELETE FROM "tracks"', { transaction })
            await sequelize.query('DELETE FROM "albums"', { transaction })
            await sequelize.query('DELETE FROM "artists"', { transaction })
            await sequelize.query('DELETE FROM "profiles"', { transaction })

            await transaction.commit()
            console.log('All data cleared successfully')
        } catch (error) {
            await transaction.rollback()
            throw error
        }
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
