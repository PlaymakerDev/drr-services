import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Prefix } from '../models/prefix.model';
import { CreatePrefixDto } from './dto/create-prefix.dto';
import { UpdatePrefixDto } from './dto/update-prefix.dto';

@Injectable()
export class PrefixService {
  constructor(
    @InjectModel(Prefix)
    private readonly prefixModel: typeof Prefix,
  ) {}

  async create(createPrefixDto: CreatePrefixDto): Promise<any> {
    try {
      // ไม่ต้องแคสต์เป็น Prefix
      const newPrefix = await this.prefixModel.create({
        prefix: createPrefixDto.prefix
      });
      
      return {
        success: true,
        message: 'Prefix created successfully',
        data: newPrefix,
      };
    } catch (error) {
      console.error('Error creating prefix:', error);
      return {
        success: false,
        message: 'Failed to create prefix',
      };
    }
  }
  // Find all prefixes
  async findAll() {
    try {
      const prefixes = await this.prefixModel.findAll();
      return {
        success: true,
        data: prefixes,
      };
    } catch (error) {
      console.error('Error fetching prefixes:', error);
      return {
        success: false,
        message: 'Failed to retrieve prefixes',
      };
    }
  }

  // Find one prefix by ID
  async findOne(id: number) {
    try {
      const prefix = await this.prefixModel.findByPk(id);
      if (!prefix) {
        return {
          success: false,
          message: `Prefix with id ${id} not found`,
        };
      }
      return {
        success: true,
        data: prefix,
      };
    } catch (error) {
      console.error(`Error finding prefix with id ${id}:`, error);
      return {
        success: false,
        message: 'Failed to retrieve the prefix',
      };
    }
  }

  // Update a prefix by ID
  async update(id: number, updatePrefixDto: UpdatePrefixDto) {
    try {
      const [updatedRows] = await this.prefixModel.update(updatePrefixDto, {
        where: { id },
      });
      if (updatedRows === 0) {
        return {
          success: false,
          message: `Prefix with id ${id} not found or no changes made`,
        };
      }
      const updatedPrefix = await this.findOne(id);
      return {
        success: true,
        message: `Prefix with id ${id} updated successfully`,
        data: updatedPrefix.data,
      };
    } catch (error) {
      console.error(`Error updating prefix with id ${id}:`, error);
      return {
        success: false,
        message: 'Failed to update the prefix',
      };
    }
  }

  // Delete a prefix by ID
  async remove(id: number) {
    try {
      const deletedRows = await this.prefixModel.destroy({
        where: { id },
      });
      if (deletedRows === 0) {
        return {
          success: false,
          message: `Prefix with id ${id} not found`,
        };
      }
      return {
        success: true,
        message: `Prefix with id ${id} deleted successfully`,
      };
    } catch (error) {
      console.error(`Error deleting prefix with id ${id}:`, error);
      return {
        success: false,
        message: 'Failed to delete the prefix',
      };
    }
  }
}
