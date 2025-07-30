import { Table, Column, Model, DataType, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement, Unique } from 'sequelize-typescript'

@Table({
    tableName: 'shows',
    timestamps: true,
    indexes: [
        { fields: ['name'] },
        { fields: ['createdAt'] }
    ]
})
export class Show extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number

    @Unique
    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    name!: string

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    description?: string

    @CreatedAt
    createdAt!: Date

    @UpdatedAt
    updatedAt!: Date
}
