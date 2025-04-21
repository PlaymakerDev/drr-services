import { Table, Column, Model, PrimaryKey, AutoIncrement, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'report_certifier',
  freezeTableName: true,
  paranoid: false,
  timestamps: false,
})
export class ReportCertifier extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  id: number;

  @Column
  report_type: string;

  @Column
  certificate_name: string;

  @Column
  certificate_role: string;

  @Column
  created_at: Date;

  @Column
  created_by: string;

  @Column
  updated_at: Date;

  @Column
  updated_by: string;
}