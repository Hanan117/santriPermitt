import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { StatusIzin, JenisIzin } from '@prisma/client';

export class QueryPermissionDto {
  @IsOptional() @IsString() santriId?: string;
  @IsOptional() @IsEnum(StatusIzin) status?: StatusIzin;
  @IsOptional() @IsEnum(JenisIzin) jenisIzin?: JenisIzin;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
