import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Profile } from '../common/Profile.js'
import { Episode } from './Episode.js'

@Table({
    tableName: 'podcast_plays',
    timestamps: true,
    indexes: [
        { fields: ['episodeId', 'timestamp'] },
        { fields: ['timestamp', 'country'] },
        { fields: ['timestamp', 'platform'] },
        { fields: ['profileId', 'timestamp'] },
        { fields: ['profileId', 'episodeId'] },
        { fields: ['timestamp'] },
        { fields: ['msPlayed'] },
        { fields: ['platform'] },
        { fields: ['country'] },
        { fields: ['shuffle'] },
        { fields: ['skipped'] },
        { fields: ['offline'] },
        { fields: ['incognitoMode'] },
        { fields: ['username'] },
        { fields: ['offlineTimestamp'] }
    ]
})
export class PodcastPlay extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @ForeignKey(() => Episode)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    episodeId!: number

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
        type: DataType.BIGINT,
        allowNull: false
    })
    msPlayed!: number

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    username?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    platform?: string

    @Column({
        type: DataType.STRING(2),
        allowNull: true
    })
    country?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    ipAddr?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    userAgent?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    reasonStart?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    reasonEnd?: string

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true,
        defaultValue: false
    })
    shuffle?: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true,
        defaultValue: false
    })
    skipped?: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true,
        defaultValue: false
    })
    offline?: boolean

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    offlineTimestamp?: Date

    @Column({
        type: DataType.BOOLEAN,
        allowNull: true,
        defaultValue: false
    })
    incognitoMode?: boolean

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date

    // Relations
    @BelongsTo(() => Episode)
    episode!: Episode

    @BelongsTo(() => Profile)
    profile!: Profile
}
