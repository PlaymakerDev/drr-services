import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { MASDistrict } from "./mas_districts.model";

@Table({
  tableName: "tbl_master_provinces",
  freezeTableName: true,
  paranoid: true,
  timestamps: true,
})
export class MASProvinces extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column
  name_th: string;

  @Column
  name_en: string;

  @Column
  region_id: number;

  @Column
  region_name_th: string;

  @Column
  region_name_en: string;

  @HasMany(() => MASDistrict, "province_id")
  districts: MASDistrict[];
}
