import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement } from 'sequelize-typescript'

@Table({
    tableName: 'artists',
    timestamps: true
})
export class Artist extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @Column({
        type: DataType.STRING(500),
        allowNull: false,
        unique: true
    })
    name!: string

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
