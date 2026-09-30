import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString() @MinLength(2) @MaxLength(100) nama!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @MinLength(5) @MaxLength(2000) pesan!: string;
}