import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Artist } from './Artist'
import { Profile } from './Profile'

@Table({
    tableName: 'artist_stats',
    timestamps: true,
    indexes: [
        { fields: ['profileId', 'artistId'], unique: true },
        { fields: ['profileId', 'totalPlays'] },
        { fields: ['profileId', 'totalMinutes'] }
    ]
})
export class ArtistStats extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @ForeignKey(() => Profile)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    profileId!: number

    @ForeignKey(() => Artist)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    artistId!: number

    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    artistName!: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    totalPlays!: number

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    })
    totalMinutes!: number

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    uniqueTracks!: number

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    uniqueAlbums!: number

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    firstPlayDate?: Date

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    lastPlayDate?: Date

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    topTrack?: {
        name: string
        plays: number
        minutes: number
    }

    @BelongsTo(() => Artist)
    artist!: Artist

    @BelongsTo(() => Profile)
    profile!: Profile

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
