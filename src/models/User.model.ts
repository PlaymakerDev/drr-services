import { Table, Column, Model, PrimaryKey, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'user',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING(100) }) 
  username: string;

  @Column({ type: DataType.STRING(100) })
  password: string;

  @Column({ type: DataType.STRING })
  prefix: string;

  @Column({type: DataType.STRING(100)})
  first_name: string;

  @Column({ type: DataType.STRING(100) })
  last_name: string;

  @Column({ type: DataType.INTEGER })
  position: number;

  @Column({ type: DataType.INTEGER })
  role: number;
  
  @Column({ type: DataType.STRING(100)})
  refreshToken: string;
}
