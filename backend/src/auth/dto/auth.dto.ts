import { IsEmail, IsString, MinLength, IsOptional, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "SecurePass123!" })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  })
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName: string;

  @ApiProperty({ required: false, example: "default-tenant" })
  @IsOptional()
  @IsString()
  tenantSlug?: string;
}

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "SecurePass123!" })
  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: "John" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, example: "Doe" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, example: "+1234567890" })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: any;
}
