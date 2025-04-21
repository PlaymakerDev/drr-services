import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'tbl_role',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class Role extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  role: string;
}
