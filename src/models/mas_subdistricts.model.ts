import {
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { MASDistrict } from "./mas_districts.model";

@Table({
  tableName: "tbl_master_subdistricts",
  freezeTableName: true,
  paranoid: true,
  timestamps: true,
})
export class MASSubDistricts extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column
  district_id: number;

  @BelongsTo(() => MASDistrict, "district_id")
  district: MASDistrict;

  @Column
  name_th: string;

  @Column
  name_en: string;
}
