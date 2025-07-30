import { Column, Model, Table, DataType, ForeignKey, BelongsTo, Index } from 'sequelize-typescript'
import { Profile } from '../common/Profile.js'

interface TopArtist {
    name: string
    plays: number
}

interface TopTrack {
    name: string
    artist: string
    plays: number
}

@Table({
    tableName: 'daily_stats',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['profileId', 'date']
        },
        {
            fields: ['date', 'profileId']
        }
    ]
})
export class DailyStats extends Model {
    @ForeignKey(() => Profile)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    @Index
    profileId!: number

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    @Index
    date!: string

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
        type: DataType.JSONB,
        allowNull: true
    })
    topArtist?: TopArtist

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    topTrack?: TopTrack

    @BelongsTo(() => Profile)
    profile!: Profile
}
