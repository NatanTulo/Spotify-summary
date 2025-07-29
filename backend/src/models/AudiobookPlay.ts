import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Audiobook } from './Audiobook.js'
import { Profile } from './Profile.js'

@Table({
    tableName: 'audiobook_plays',
    timestamps: true,
    indexes: [
        { fields: ['audiobookId', 'timestamp'] },
        { fields: ['timestamp', 'country'] },
        { fields: ['timestamp', 'platform'] },
        { fields: ['profileId', 'timestamp'] },
        { fields: ['profileId', 'audiobookId'] },
        { fields: ['timestamp'] },
        { fields: ['msPlayed'] },
        { fields: ['platform'] },
        { fields: ['country'] },
        { fields: ['shuffle'] },
        { fields: ['skipped'] },
        { fields: ['offline'] },
        { fields: ['incognitoMode'] },
        { fields: ['chapterTitle'] },
        { fields: ['username'] },
        { fields: ['offlineTimestamp'] }
    ]
})
export class AudiobookPlay extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @ForeignKey(() => Audiobook)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    audiobookId!: number

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
    chapterTitle?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    chapterUri?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    country?: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    platform?: string

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
        allowNull: false,
        defaultValue: false
    })
    shuffle!: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    skipped!: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    offline!: boolean

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    offlineTimestamp?: Date

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    incognitoMode!: boolean

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date

    @BelongsTo(() => Audiobook)
    audiobook!: Audiobook

    @BelongsTo(() => Profile)
    profile!: Profile
}
