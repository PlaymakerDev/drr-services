import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'tbl_master',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class TblMaster extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER }) // Change 'int' to DataType.INTEGER
  mas_id: number;

  @Column
  mas_group_code: string;

  @Column
  mas_group_name: string;

  @Column({ field: 'mas_code' })
  masCode: string;

  @Column
  mas_name: string;

  @Column
  mas_seq: number;

  @Column
  mas_parent_code: string;

  @Column({ type: DataType.TEXT })
  logo: string;
}
