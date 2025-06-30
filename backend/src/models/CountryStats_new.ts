import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Profile } from './Profile'

@Table({
    tableName: 'country_stats',
    timestamps: true,
    indexes: [
        { fields: ['profileId', 'country'], unique: true },
        { fields: ['profileId', 'totalPlays'] },
        { fields: ['totalPlays'] }
    ]
})
export class CountryStats extends Model {
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

    @Column({
        type: DataType.STRING(2),
        allowNull: false
    })
    country!: string

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
        type: DataType.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
    })
    percentage!: number

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
    uniqueArtists!: number

    @Column({
        type: DataType.JSONB,
        allowNull: true
    })
    topArtist?: {
        name: string
        plays: number
    }

    @BelongsTo(() => Profile)
    profile!: Profile

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
