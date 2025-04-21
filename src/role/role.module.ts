import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role } from 'src/models/role.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesGuard } from 'src/guards/role.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([Role]),
  ],
  controllers: [RoleController],
  providers: [RoleService, RolesGuard],
})
export class RoleModule {}
