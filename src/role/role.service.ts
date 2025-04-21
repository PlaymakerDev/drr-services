import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../models/role.model';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role)
    private readonly roleModel: typeof Role,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<any> {
    try {
      // ไม่ต้องแคสต์เป็น role
      const newRole = await this.roleModel.create({
        role: createRoleDto.role
      });
      
      return {
        success: true,
        message: 'Role created successfully',
        data: newRole,
      };
    } catch (error) {
      console.error('Error creating role:', error);
      return {
        success: false,
        message: 'Failed to create role',
      };
    }
  }
  // Find all rolees
  async findAll() {
    try {
      const rolees = await this.roleModel.findAll();
      return {
        success: true,
        data: rolees,
      };
    } catch (error) {
      console.error('Error fetching rolees:', error);
      return {
        success: false,
        message: 'Failed to retrieve rolees',
      };
    }
  }

  // Find one role by ID
  async findOne(id: number) {
    try {
      const role = await this.roleModel.findByPk(id);
      if (!role) {
        return {
          success: false,
          message: `Role with id ${id} not found`,
        };
      }
      return {
        success: true,
        data: role,
      };
    } catch (error) {
      console.error(`Error finding role with id ${id}:`, error);
      return {
        success: false,
        message: 'Failed to retrieve the role',
      };
    }
  }

  // Update a role by ID
  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      const [updatedRows] = await this.roleModel.update(updateRoleDto, {
        where: { id },
      });
      if (updatedRows === 0) {
        return {
          success: false,
          message: `Role with id ${id} not found or no changes made`,
        };
      }
      const updatedRole = await this.findOne(id);
      return {
        success: true,
        message: `Role with id ${id} updated successfully`,
        data: updatedRole.data,
      };
    } catch (error) {
      console.error(`Error updating role with id ${id}:`, error);
      return {
        success: false,
        message: 'Failed to update the role',
      };
    }
  }

  // Delete a role by ID
  async remove(id: number) {
    try {
      const deletedRows = await this.roleModel.destroy({
        where: { id },
      });
      if (deletedRows === 0) {
        return {
          success: false,
          message: `role with id ${id} not found`,
        };
      }
      return {
        success: true,
        message: `role with id ${id} deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting role with id ${id}:`, error);
      return {
        success: false,
        message: 'Failed to delete the role',
      };
    }
  }
}
