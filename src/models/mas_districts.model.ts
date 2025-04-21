import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { MASProvinces } from "./mas_provinces.model";
import { MASSubDistricts } from "./mas_subdistricts.model";

@Table({
  tableName: "tbl_master_districts",
  freezeTableName: true,
  paranoid: true,
  timestamps: true,
})
export class MASDistrict extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column
  province_id: number;

  @BelongsTo(() => MASProvinces, "province_id")
  province: MASProvinces;

  @Column
  name_th: string;

  @Column
  name_en: string;

  @HasMany(() => MASSubDistricts, "district_id")
  sub_districts: MASSubDistricts[];
}
