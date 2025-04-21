import { Table, Column, Model, PrimaryKey, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tbl_department',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class TblDepartment extends Model {
  @PrimaryKey
  @Column({ type: DataType.INTEGER })
  deptid: number;

  @PrimaryKey
  @Column({ type: DataType.STRING(100) })  // Use STRING for varchar
  deptname: string;

  @PrimaryKey
  @Column({ type: DataType.INTEGER })
  depttype: number;

  @PrimaryKey
  @Column({ type: DataType.INTEGER })
  deptgroup: number;

  @Column({ type: DataType.STRING(100), allowNull: true })
  deptprovince: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  deptgroupdrr: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  deptofficeno: number;  

  @Column({ type: DataType.STRING(255), allowNull: true })
  deptshort: string;
}
