import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/models/User.model';
import { JwtModule } from '@nestjs/jwt';
import { Role } from 'src/models/role.model';
import { RoleModule } from 'src/role/role.module';
import { TblPosition } from 'src/models/position.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Role, TblPosition]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
