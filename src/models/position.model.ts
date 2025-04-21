import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tbl_position',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class TblPosition extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  PID: number;

  @Column({ type: DataType.STRING })
  PName: string;
}
