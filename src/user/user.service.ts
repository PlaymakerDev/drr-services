import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { BodyUSer, LdapUserDto, login, searchDto, signUp } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import axios from 'axios'
import { User } from 'src/models/User.model';
import * as ldap from 'ldapjs';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/models/role.model';
import { TblPosition } from 'src/models/position.model';
import { Op } from 'sequelize';
import { sign } from 'jsonwebtoken'; 
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class UserService {
  private client: ldap.Client;
  private readonly logger = new Logger(UserService.name);
  constructor(
    @InjectModel(User)
    @InjectModel(User) private readonly UserRepo: typeof User,
    @InjectModel(Role) private readonly roleRepo: typeof Role,
    @InjectModel(TblPosition) private readonly positionRepo: typeof TblPosition,
    private readonly jwtService: JwtService,
    private readonly sequelize: Sequelize

  ) {}

  async search(keyword: string): Promise<any> {
    const data = JSON.stringify({ keyword }); 
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://wts.drr.go.th/sso/search',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${'2ae3be4f7863e2641f3b331d811a3623b65ab398'}` 
      },
      data: data
    };
  
    try {
      const response = await axios.request(config);
      return response.data; 
    } catch (error) {
      console.error('Error occurred:', error.response ? error.response.data : error.message);
      throw error; 
    }
  }

  async searchget(query: searchDto): Promise<any> {
    const data = query; 
    
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://wts.drr.go.th/sso/search',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${'2ae3be4f7863e2641f3b331d811a3623b65ab398'}` 
      },
      data: data
    };
    try {
      const response1 = await axios.request(config)
      const aa = response1.data

      

      return aa
    } catch (error) {
      console.error('Error occurred:', error.response ? error.response.data : error.message);
      throw error; 
    }
  }
  async user(body: signUp) {
    try {
      const { username, prefix, first_name, last_name, role, position } = body;

     
      let userDB = await this.UserRepo.findOne({
        where: {
          username,
        },
      });


      if (!userDB) {
        userDB = await this.UserRepo.create({
          username,
          prefix,
          first_name,
          last_name,
          position,
          role,
        });
      }

      const userrole = await this.roleRepo.findOne({
        where: {
          id: userDB.role
        },
        attributes:['role']
      })
      

      // userDB.refreshToken = response.data.token;
      await this.UserRepo.update({ refreshToken: userDB.refreshToken }, {
        where: { id: userDB.id }
      });
      let token = ''
      if(userDB.refreshToken) {
        token = this.jwtService.sign({ id: userDB.id, username: userDB.username, role: userDB.role, refreshtoken: userDB.refreshToken})
      }
      
      token = this.jwtService.sign({ id: userDB.id, username: userDB.username, role: userDB.role });
      return {
        success: true,
        data: {
          username,
          prefix,
          first_name,
          last_name,
          position,
          userrole,
          token
        },
        message: `user ${userDB.username} login success`
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error,
        message: 'sign in fail'
      }
    }
  }
  async logout(username: string) {
    await this.UserRepo.update(
      { refreshToken: null },
      { where: { username: username } }
    );
  }

  async update(username: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.UserRepo.findOne({
        where: { username },
      });

      if (!user) {
        throw new HttpException('User not found', 404);
      }

      await user.update(updateUserDto);

      return{
        success: true,
        massage: 'update user success',
        user
      } 
    } catch (error) {
      console.error('Error updating user:', error);
      throw new HttpException('Internal server error', 500);
    }
  }

  async findAll() {
    const users = await this.UserRepo.findAll();
  
    const usersWithPositionsAndRoles = await Promise.all(users.map(async (user) => {
      const positionName = await this.positionRepo.findOne({
        where: {
          PID: user.position
        },
        attributes: ['PName']
      });
      const roleName = await this.roleRepo.findOne({
        where: {
          id: user.role
        },
        attributes: ['role']
      });
      const position = positionName ? positionName.PName : null;
      const role = roleName ? roleName.role : null;
      return {
        ...user.toJSON(),
        position: position,
        role: role
      };
    }));
  
    return usersWithPositionsAndRoles;
  }
  
  async remove(username: string) {
    const user = await this.UserRepo.findOne({
      where: {
        username
      }
    })
    if(!user){
      throw new BadRequestException('No username in data')
    }

    await this.UserRepo.destroy({ where: { username}})
    return {message: `user ${user.username} delete successfully`};
  }

  create(createUserDto: LdapUserDto) {
    return 'This action adds a new user';
  }


  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async Rebreath (body:any, ip: any){
    try {

      const token = body.headers.authorization.split(' ')[1];
      
    const mtoken= this.jwtService.decode(token)
    
    if (mtoken.exp < (new Date().getTime() + 1) / 1000) {
      throw new HttpException('YOU SHALL NOT PASS',HttpStatus.UNAUTHORIZED)}
      const raw = {
        id: mtoken.id,
        username: mtoken.username,
        prefix: mtoken.prefix ,
        firstname: mtoken.firstname,
        lastname: mtoken.lastname,
        position: mtoken.position,
        role: mtoken.role,
        rememberMe: mtoken.rememberMe
      }      
      const jwt = this.jwtService.sign(raw, {
        expiresIn: raw.rememberMe ? '7d' : '1h',  // 7 days if rememberMe is true, otherwise 1 hour
      });
      return {
        data: raw,
        token: jwt,
      };

    
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.UNAUTHORIZED,
        error,
      );
    
    }
  }
  async login(body: login) {
    try {
      const { username, password, rememberMe } = body;
  
      const signIn = { username, password };
  
      const url = `https://wts.drr.go.th/sso/auth`;
      const response = await axios.post(url, signIn);
      

  
      if (response.data.success === false) {
        return {
          success: false,
          message: 'Login failed - Invalid user',
        };
      }
      const { refreshToken } = response.data;
      const userDB = await this.UserRepo.findOne({
        where: { username },
      });
      if (!userDB) {
        return {
          success: false,
          message: 'User not found',
        };
      }
      const expiresIn = rememberMe ? '7d' : '15m';
      console.log('Token >>>>> ',userDB);
      
      const token = this.jwtService.sign(
        {
          id: userDB.id,
          username: userDB.username,
          role: userDB.role,
          rememberMe: rememberMe
        },
        { expiresIn }
      );
  
      const refreshtoken = await this.generateRefreshToken({username: userDB.username, role: userDB.role, id: userDB.id }); 
      
      const userRole = await this.roleRepo.findOne({
        where: {
          id: userDB.role
        },
        attributes: ['role'],
        raw: true
      });
      const role = userRole.role;

      await this.UserRepo.update(
        {
      refreshToken: refreshtoken
      },
      {
        where: {
          username: userDB.username
        }
      }
      )
  
      // Login success - return token and message
      return {
        success: true,
        message: 'Login successful',
        username: userDB.username,
        role,
        accesstoken: token,
        refreshtoken: refreshtoken, // ส่งคืน Refresh Token
      };
  
    } catch (error) {
      // Log error for debugging purposes
      console.log('Error during login:', error);
      
      // Return error message
      return {
        success: false,
        message: 'Login failed',
        error: error.message || 'Unknown error occurred',
      };
    }
  }
  async findUser(username: string, page: number = 1, limit: number = 10) {
    try {
      
      limit = Number(limit);
      const offset = (page - 1) * limit;

      let whereCondition;
      if (username === '{username}') {
        whereCondition = {}; // Return all users if the placeholder is used
      } else {
        whereCondition = username && username.trim() !== ''
          ? { username: { [Op.like]: `%${username}%` } }
          : {}; // Use an empty condition if username is empty
      }
  
      const users = await User.findAndCountAll({
        where: whereCondition,
        limit,   // Limit the number of users per page
        offset,  // Offset to get the correct page
      });

      // If no users found, return a message
      if (!users || users.rows.length === 0) {
        return { message: 'User not found' };
      }
  
      // Filter out sensitive fields like password and refreshToken
      const filteredUsers = users.rows.map(user => {
        const { refreshToken, password, ...filteredData } = user.toJSON();
        return filteredData;
      });

      
  
      // Calculate pagination info
      const totalItems = users.count;
      const totalPages = Math.ceil(totalItems / limit);
      const currentPage = page;
      const hasNextPage = currentPage < totalPages; // ถ้ามีหน้าถัดไปจะเป็น true
      const hasPreviousPage = currentPage > 1; // ถ้ามีหน้าก่อนหน้าจะเป็น true
      
      return {
        success: true,
        data: filteredUsers,
        meta: {
          totalItems,
          totalPages,
          pageSize: limit,
          currentPage,
          hasNextPage,       // ใช้ Boolean แทนหมายเลขหน้า
          hasPreviousPage    // ใช้ Boolean แทนหมายเลขหน้า
        }
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Error fetching user');
    }
  }
  async generateRefreshToken({ username, role, id }: { username: string; role: number; id: number }): Promise<string> {
    const payload = { username, role, id };
    const token = sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return token;
  }

  async deleteUser(param: string) {
    const transaction = await this.sequelize.transaction()
    try {
      const getUser = await this.UserRepo.findOne(
        {
          where: {
            username: param
          }
        }
      )

      const userID = getUser.id

      const deleteUser = await this.UserRepo.destroy(
        {
          where: {
            id: userID
          },
          transaction
        }
      )

      await transaction.commit()
      return {
        success: true,
        data: {
          deleteUser,
          getUser
        },
        message: `Delete ${getUser} success`
      }
    } catch (error) {
      await transaction.rollback()
      console.log(error);
      return {
        success: false,
        error,
        message: `Delete user failure`
      }
    }
  }
}  
