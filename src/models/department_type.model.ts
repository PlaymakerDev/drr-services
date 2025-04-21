import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tbl_department_type',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class TblDepartmentType extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  dept_type: number;

  @Column({ type: DataType.STRING })
  dept_type_desc: string;
}
