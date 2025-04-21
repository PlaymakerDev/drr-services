import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectModel } from '@nestjs/sequelize';
import { TblDepartment } from 'src/models/department.model';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(TblDepartment)
    private readonly tblDepartmentRepo: typeof TblDepartment,
  ) {}

  async findAll() {
    try {
      const department = await this.tblDepartmentRepo.findAll({
        attributes: ['deptname', 'depttype', 'deptofficeno'],
        order: ['depttype', 'deptofficeno']
      })
      return {
        department: {
          department
        },
      }
    }
    catch(error) {
      console.log(error);      
    }
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} department`;
  // }

  // update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
  //   return `This action updates a #${id} department`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} department`;
  // }
}
