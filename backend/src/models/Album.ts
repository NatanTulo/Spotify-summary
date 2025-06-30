import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { Artist } from './Artist.js'

@Table({
    tableName: 'albums',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['name', 'artistId']
        }
    ]
})
export class Album extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    name!: string

    @ForeignKey(() => Artist)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    artistId!: number

    @BelongsTo(() => Artist)
    artist!: Artist

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
