import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";

export class LdapUserDto {}

export class BodyUSer {
  @ApiProperty()
  @IsString()
  username: string;
  @ApiProperty()
  @IsString()
  password?: string;
  @ApiProperty()
  @IsString()
  prefix?: string;
  @ApiProperty()
  @IsString()
  first_name?: string;
  @ApiProperty()
  @IsString()
  last_name?: string;
  @ApiProperty()
  @IsNumber()
  position?: number;
  @ApiProperty()
  @IsNumber()
  role?: number;
}

export class signUp {
  @ApiProperty()
  @IsString()
  username: string;
  @ApiProperty()
  @IsString()
  prefix?: string;
  @ApiProperty()
  @IsString()
  first_name?: string;
  @ApiProperty()
  @IsString()
  last_name?: string;
  @ApiProperty()
  @IsNumber()
  position?: number;
  @ApiProperty()
  @IsNumber()
  role?: number;
}


export class login {
  @ApiProperty()
  @IsString()
  username: string;
  
  @ApiProperty()
  @IsString()
  password?: string;

  @ApiProperty()
  @IsBoolean()
  rememberMe?: boolean;

}

export class searchDto {
  @ApiProperty({ required: false })
  @IsString()
  keyword?: string
}

export class usernameDto {
  @ApiProperty({ required: false })
  @IsString()
  username?: string
}