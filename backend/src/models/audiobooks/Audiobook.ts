import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, HasMany } from 'sequelize-typescript'
import { AudiobookPlay } from './AudiobookPlay.js'

@Table({
    tableName: 'audiobooks',
    timestamps: true,
    indexes: [
        { fields: ['name'] },
        { fields: ['spotifyUri'] },
        { fields: ['createdAt'] }
    ]
})
export class Audiobook extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name!: string

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    spotifyUri?: string

    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date

    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date

    @HasMany(() => AudiobookPlay)
    plays!: AudiobookPlay[]
}
