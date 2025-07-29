import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, Unique } from 'sequelize-typescript'
import { Show } from './Show.js'

@Table({
    tableName: 'episodes',
    timestamps: true,
    indexes: [
        { fields: ['showId', 'name'] },
        { fields: ['spotifyUri'] },
        { fields: ['name'] },
        { fields: ['createdAt'] }
    ]
})
export class Episode extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @ForeignKey(() => Show)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    showId!: number

    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    name!: string

    @Unique
    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    spotifyUri?: string

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    description?: string

    @BelongsTo(() => Show)
    show!: Show

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
