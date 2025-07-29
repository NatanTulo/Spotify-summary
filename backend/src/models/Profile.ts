import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement } from 'sequelize-typescript'

@Table({
    tableName: 'profiles',
    timestamps: true
})
export class Profile extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
        unique: true
    })
    name!: string

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    username?: string

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    lastImport?: Date

    // Statistics stored as JSONB for better performance
    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: {
            totalPlays: 0,
            totalMinutes: 0,
            uniqueTracks: 0,
            uniqueArtists: 0,
            uniqueAlbums: 0,
            totalVideoPlays: 0,
            uniqueShows: 0,
            uniqueEpisodes: 0
        }
    })
    statistics!: {
        totalPlays: number
        totalMinutes: number
        uniqueTracks: number
        uniqueArtists: number
        uniqueAlbums: number
        totalVideoPlays?: number
        uniqueShows?: number
        uniqueEpisodes?: number
    }

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
