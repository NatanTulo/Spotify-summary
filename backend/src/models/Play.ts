import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Track } from './Track.js'
import { Profile } from './Profile.js'

@Table({
    tableName: 'plays',
    timestamps: true,
    indexes: [
        { fields: ['trackId', 'timestamp'] },
        { fields: ['timestamp', 'country'] },
        { fields: ['timestamp', 'platform'] },
        { fields: ['profileId', 'timestamp'] },
        { fields: ['profileId', 'trackId'] },
        { fields: ['timestamp'] },
        { fields: ['msPlayed'] },
        { fields: ['platform'] },
        { fields: ['country'] },
        { fields: ['shuffle'] },
        { fields: ['skipped'] },
        { fields: ['offline'] },
        { fields: ['incognitoMode'] }
    ]
})
export class Play extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @ForeignKey(() => Track)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    trackId!: number

    @ForeignKey(() => Profile)
    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    profileId?: number

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    timestamp!: Date

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    })
    msPlayed!: number

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    username?: string

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    platform?: string

    @Column({
        type: DataType.STRING(2),
        allowNull: true
    })
    country?: string

    @Column({
        type: DataType.STRING(45),
        allowNull: true
    })
    ipAddress?: string

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    userAgent?: string

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    reasonStart?: string

    @Column({
        type: DataType.STRING(100),
        allowNull: true
    })
    reasonEnd?: string

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    shuffle?: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    skipped?: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    offline?: boolean

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    offlineTimestamp?: Date

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true
    })
    incognitoMode?: boolean

    @BelongsTo(() => Track)
    track!: Track

    @BelongsTo(() => Profile)
    profile!: Profile

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
