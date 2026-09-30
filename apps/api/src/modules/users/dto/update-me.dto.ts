import { IsOptional, IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(50) username?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}