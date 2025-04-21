import { BadRequestException, Body, HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateTblmasterDto } from './dto/create-tblmaster.dto';
import { UpdateTblmasterDto } from './dto/update-tblmaster.dto';
import { InjectModel } from '@nestjs/sequelize';
import { TblMaster } from 'src/models/master.model';
import * as fs from 'fs';
import * as path from 'path';
import { CLIENT_RENEG_LIMIT } from 'tls';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class TblmasterService {
  constructor(
    @InjectModel(TblMaster)
    private readonly tblmasterRepo: typeof TblMaster,
    private readonly sequelize: Sequelize

  ) {}

  async uploadLogo(file: string, mas_name: string) {
    const fileUrl = `${file}`;

    const lastRecord = await this.tblmasterRepo.findOne({
      order: [[Sequelize.cast(Sequelize.col('mas_code'), 'INTEGER'), 'DESC']],
      where: { mas_group_code: '4' },
      attributes: ['mas_code'],
    });

    let newMasCode = 1;
    let masCode = '';

    if (lastRecord && lastRecord.dataValues && lastRecord.dataValues.mas_code) {
      masCode = lastRecord.dataValues.mas_code;
      newMasCode = parseInt(masCode, 10) + 1;
    }

    const masSeq = newMasCode * 100;

    const newMaster = await this.tblmasterRepo.create({
      mas_group_name: 'แหล่งที่มาของข้อมูล',
      mas_name: mas_name,
      mas_seq: masSeq,
      mas_group_code: '4',
      mas_parent_code: '',
      masCode: newMasCode.toString(),
      logo: fileUrl,
    });

    return {
      id: newMaster.mas_id,
      logoUrl: fileUrl,
    };
  }
  async findAll() {
    try {
      const allMasters = await this.tblmasterRepo.findAll({
        where: {
          mas_group_code: 4,
        },
      });
  
      return {
        success: true,
        data: allMasters,
      };
    } catch (error) {
      console.error("Error fetching tblmaster records:", error);
      return {
        success: false,
        message: "Failed to retrieve tblmaster records. Please try again later.",
      };
    }
  }

  async findOne(mas_id: number) {
    const master = await this.tblmasterRepo.findOne({
      where: {
        mas_id: mas_id
      }
    });
    
    if (!master) {
      throw new Error(`No tblmaster found with id #${mas_id}`);
    }
    return {
      sucess: true,
      data: master
    };
  }
  async updateMaster(mas_id: number, filename: string | null, body: { mas_name?: string }) {
    if (!mas_id) {
      throw new NotFoundException(`mas_id is required`);
    }
  
    const record = await this.tblmasterRepo.findByPk(mas_id);
  
    if (!record) {
      throw new NotFoundException(`Record with ID ${mas_id} not found`);
    }
  
    if (body.mas_name) {
      record.mas_name = body.mas_name; 
    }
  
    if (filename === null) {
      record.logo = null;
    } else if (filename !== '') {
      record.logo = filename;
    }
  
    try {
      await record.save();
    } catch (error) {
      console.error('Error updating record:', error);
      throw new InternalServerErrorException('Failed to update record');
    }
  
    return {
      success: true,
      message: 'Record updated successfully',
      updatedRecord: record,
    };
  }
  

  async deleteMaster(mas_id: number) {
    const record = await this.tblmasterRepo.findOne({ where: { mas_id } });
    if(record.mas_seq < 1000) {
      throw new BadRequestException(`Record is important priority can't deleted`)
    }
    if (!record) {
      throw new NotFoundException(`Record with ID ${mas_id} not found`);
    }

    await this.tblmasterRepo.destroy({ where: { mas_id } });
  }



  async deleteSourceType(param: number) {
    const transaction = await this.sequelize.transaction()
    try {
      
      const getSourceType = await this.tblmasterRepo.findOne(
        {
          where: {
            mas_id: param
          }
        }
      )
      if(getSourceType.mas_seq < 1000) {
        throw new BadRequestException(`Record is important priority can't deleted`)
      }
      if (!getSourceType) {
        throw new HttpException('Data not found', HttpStatus.NOT_FOUND)
      }

      const sourceID = getSourceType.mas_id

      const deleteSourceType = await this.tblmasterRepo.destroy(
        {
          where: {
            mas_id: sourceID
          },
          transaction
        }
      )
      await transaction.commit()
      return {
        success: true,
        data: {
          getSourceType,
          deleteSourceType
        },
        message: 'delete source type successfully'
      }
    } catch (error) {
      await transaction.rollback()
      console.log(error);
      return {
        success: false,
        error,
        message: 'delete source type failure'
      }
    }
  }
}