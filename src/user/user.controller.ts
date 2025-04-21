import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpException, Put, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { BodyUSer, LdapUserDto, login, searchDto, signUp, usernameDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { User } from 'src/models/User.model';
import { RolesGuard } from '../guards/role.guard';
import { Role } from '../guards/roles.decorator';

@ApiTags('users')
@UseGuards(RolesGuard)
  @Controller('user')
  export class UserController {
    constructor(private readonly userService: UserService) {}
    @Post('signup')
    async user(
      @Res() res: Response,
      @Body() body: signUp
    ) {
      const data = await this.userService.user(body)
      if (data) {
        return res.status(200).json(data)
      } else {
        throw new HttpException(data.error.response, data.error.status)
      }
    }
    @Post('login')
    async login(
      @Res() res: Response,
      @Body() body: login  // Ensure `LoginDto` is a proper DTO for validation
    ) {
      try {
        // Call the login method from the service
        const result = await this.userService.login(body);
        const {username, role, accesstoken, refreshtoken} = result
        // Check if the login was successful
        if (result.success) {
          return res.status(200).json({
            success: true,
            message: result.message,
            data: {
              username: username,
              role,
              token: accesstoken ,
              refreshtoken: refreshtoken,
            }
          });
        } else {
          return res.status(400).json({
            success: false,
            message: result.message || 'Login failed',
            error: result.error,
          });
        }
      } catch (error) {
        // Handle any unexpected errors
        return res.status(500).json({
          success: false,
          message: 'An internal server error occurred',
          error: error.message || 'Unknown error',
        });
      }
    }
    
  @ApiBearerAuth()
  @Get("retoken")
  @ApiOperation({ summary: "Return current user data" })
  reToken(@Req() req: Request) {
    const ip = req['clientIp']
    return this.userService.Rebreath(req, ip);
  }

  @Post('search')
  @Role(1)
  @ApiBearerAuth()

  async searchUser(@Body() body: searchDto) {
    const { keyword } = body;

    try {
      const user = await this.userService.search(keyword);
      return user.length ? user : { message: 'User not found' };
    } catch (error) {
      return { message: 'Error searching for user', error };
    }
  }
  
  @Get('search')
  @Role(1)
  @ApiBearerAuth()
  async searchUserGet(@Query() query:searchDto) {

    try {
      const user = await this.userService.searchget(query);
      return user.length ? user : { message: 'User not found' };
    } catch (error) {
      return { message: 'Error searching for user', error };
    }
  }
  
  @Role(1, 2)
  @ApiBearerAuth()
  // @ApiParam({ name: 'username', required: false })
  @Get('findUser')
  @ApiQuery({ name: 'username', type: String, required: false, description: 'Name Filter' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number for pagination (default: 1)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Number of items per page (default: 10)' })
  async findOne(
    @Query('username') username?: string,  // รับค่า username จาก query parameter
    @Query('page') page?: number,          // รับค่า page จาก query parameter
    @Query('limit') limit?: number         // รับค่า limit จาก query parameter
  ) {
    
    // ตรวจสอบว่าได้ค่า page หรือ limit มาหรือไม่ ถ้าไม่ให้ใช้ค่า default
    const currentPage = page && page > 0 ? page : 1;
    const pageSize = limit && limit > 0 ? limit : 10;
  
    const user = await this.userService.findUser(username, currentPage, pageSize);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    return user;
  }
  
  
  @Post('logout')
  @Role(1)
  @ApiBearerAuth()
  async logout(@Body() body: usernameDto) {
    await this.userService.logout(body.username);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Post(':username')
  @Role(1)
  @ApiBearerAuth()
  async updateUser(
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return await this.userService.update(username, updateUserDto);
  }

  @Get()
  @Role(1)
  @ApiBearerAuth()
  async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Post('delete_user/:username')
  @Role(1)
  @ApiBearerAuth()
  async deleteUser(
    @Res() res: Response,
    @Param('username') param: string,
  ){
    const data = await this.userService.deleteUser(param)
    if (data) {
      return res.status(200).json(data)
    } else {
      throw new HttpException(data.error.response, data.error.status)
    }
  }
}
