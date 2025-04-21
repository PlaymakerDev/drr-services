import { HttpException, HttpStatus, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateTblpositionDto, EditPositionBody } from './dto/create-tblposition.dto';
import { UpdateTblpositionDto } from './dto/update-tblposition.dto';
import { InjectModel } from '@nestjs/sequelize';
import { TblPosition } from 'src/models/position.model';
import { Sequelize } from 'sequelize-typescript';


@Injectable()
export class TblPositionService {
  constructor(
    @InjectModel(TblPosition)
    private readonly tblpositionRepo: typeof TblPosition,
    private readonly sequelize: Sequelize
  ) {}

  async create(createTblpositionDto: CreateTblpositionDto){
    try {
      const newPosition = await this.tblpositionRepo.create({
        ...createTblpositionDto,
      });
      return {
        success: true,
        newPosition,
        massage: 'Add new position successfully'
      }
    } catch (error) {
      console.error('Error creating position:', error);
      throw new InternalServerErrorException('Failed to create position');
    }
  }
  async findAll() {
    try {
      const position = await this.tblpositionRepo.findAll()
      return {
        success: true,
        position
      }
    } catch (error) {
      return {
        success: false,
        error,
      }
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} tblposition`;
  }
  
  async deletePosition(PID: number) {
    const transaction = await this.sequelize.transaction()
    try {
      const getPosition = await this.tblpositionRepo.findOne(
        {
          where: {
            PID: PID
          }
        }
      )
      if (!getPosition) {
        throw new HttpException('Position not found', HttpStatus.NOT_FOUND)
      }

      const deletePosition = await this.tblpositionRepo.destroy(
        {
          where: {
            PID: getPosition.PID
          },
          transaction
        }
      )

      
      await transaction.commit()

      return {
        success: true,
        data: {
          deletePosition,
          getPosition
        },
        message: `Delete ${PID} success` 
      }


    } catch (error) {
      await transaction.rollback()
      console.log(error);
      return {
        success: false,
        error,
        message: `Delete ${PID} fail`
      }
    }
  }

  async editPoition(param: number, body: EditPositionBody) {
    const { PName } = body
    const transaction = await this.sequelize.transaction()
    try {
      const getPosition = await this.tblpositionRepo.findOne(
        {
          where: {
            PID: param
          }
        }
      )
      const editPosition = await this.tblpositionRepo.update(
        {
          PName: PName
        },
        {
          where: {
            PID: getPosition.PID
          },
          transaction
        }
      )

      await transaction.commit()

      return {
        success: true,
        data: {
          editPosition,
          getPosition
        },
        message: `Edit ${param} successfully`
      }
    } catch (error) {
      await transaction.rollback()
      console.log(error);
      return {
        success: error,
        error,
        message: `Edit ${param} failure`
      }
      
    }
  }
}
