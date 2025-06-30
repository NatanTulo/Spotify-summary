import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Album } from './Album'

@Table({
    tableName: 'tracks',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['name', 'albumId']
        },
        {
            fields: ['uri']
        }
    ]
})
export class Track extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    name!: string

    @ForeignKey(() => Album)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    albumId!: number

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    uri?: string

    @Column({
        type: DataType.INTEGER,
        allowNull: true,
        validate: {
            min: 0
        }
    })
    duration?: number

    @BelongsTo(() => Album)
    album!: Album

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
