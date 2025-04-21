import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { MASProvinces } from 'src/models/mas_provinces.model';
import { MASDistrict } from 'src/models/mas_districts.model';
import { MASSubDistricts } from 'src/models/mas_subdistricts.model';

@Injectable()
export class MasterService {
  constructor(
    @InjectModel(MASProvinces)
    private readonly provinces: typeof MASProvinces,
    @InjectModel(MASDistrict)
    private readonly district: typeof MASDistrict,
    @InjectModel(MASSubDistricts)
    private readonly subDistrict: typeof MASSubDistricts,
  ) {}

  async getProvinces(textSearch?: string, id?: number) {
    let whereOp: Record<string, unknown> = {};

    if (textSearch) {
      whereOp = {
        ...whereOp,
        [Op.or]: {
          name_th: { [Op.like]: `%${textSearch}%` },
          name_en: { [Op.like]: `%${textSearch}%` },
        },
      };
    }

    if (id) {
      whereOp.id = id;
    }

    const data = await this.provinces.findAll({
      attributes: [
        "id",
        "name_th",
        "name_en",
        "region_id",
        "region_name_th",
        "region_name_en",
      ],
      where: whereOp,
      order: [["name_th", "asc"]],
    });

    return { data };
  }

  async getDistrict(textSearch?: string, id?: number, province_id?: number) {
    let whereOp: Record<string, unknown> = {};

    if (textSearch) {
      whereOp = {
        ...whereOp,
        [Op.or]: {
          name_th: { [Op.like]: `%${textSearch}%` },
          name_en: { [Op.like]: `%${textSearch}%` },
        },
      };
    }

    if (id) {
      whereOp.id = id;
    }

    if (province_id) {
      whereOp.province_id = province_id;
    }

    const data = await this.district.findAll({
      attributes: ["id", "province_id", "name_th", "name_en"],
      where: whereOp,
      order: [["name_th", "asc"]],
    });

    return { data };
  }

  async getSubDistrict(textSearch?: string, id?: number, district_id?: number) {
    let whereOp: Record<string, unknown> = {};

    if (textSearch) {
      whereOp = {
        ...whereOp,
        [Op.or]: {
          name_th: { [Op.like]: `%${textSearch}%` },
          name_en: { [Op.like]: `%${textSearch}%` },
        },
      };
    }

    if (id) {
      whereOp.id = id;
    }

    if (district_id) {
      whereOp.district_id = district_id;
    }

    const data = await this.subDistrict.findAll({
      attributes: ["id", "name_th", "name_en"],
      where: whereOp,
      order: [["name_th", "asc"]],
    });

    return { data };
  }
}
