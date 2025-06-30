import { Column, Model, Table, DataType, ForeignKey, BelongsTo, Index } from 'sequelize-typescript'
import { Profile } from './Profile.js'

interface TopArtist {
    name: string
    plays: number
    minutes: number
}

interface TopTrack {
    name: string
    artist: string
    plays: number
    minutes: number
}

interface MonthlyBreakdown {
    month: number
    plays: number
    minutes: number
}

@Table({
    tableName: 'yearly_stats',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['profileId', 'year']
        },
        {
            fields: ['year', 'profileId']
        }
    ]
})
export class YearlyStats extends Model {
    @ForeignKey(() => Profile)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    @Index
    profileId!: number

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    @Index
    year!: number

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0
    })
    totalPlays!: number

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0
    })
    totalMinutes!: number

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0
    })
    uniqueTracks!: number

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0
    })
    uniqueArtists!: number

    @Column({
        type: DataType.INTEGER,
        defaultValue: 0
    })
    uniqueAlbums!: number

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    topArtist?: TopArtist

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    topTrack?: TopTrack

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    monthlyBreakdown?: MonthlyBreakdown[]

    @BelongsTo(() => Profile)
    profile!: Profile
}
