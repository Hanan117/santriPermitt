import { IsString, IsEnum, IsOptional, IsDateString, Matches } from 'class-validator';
import { JenisIzin } from '@prisma/client';

export class CreatePermissionDto {
  @IsOptional() @IsString() santriId?: string;
  @IsEnum(JenisIzin) jenisIzin!: JenisIzin;
  @IsString() tujuan!: string;
  @IsString() alasan!: string;
  @IsOptional() @IsString() keterangan?: string;
  @IsDateString() tanggalKeluar!: string;
  @Matches(/^\d{2}:\d{2}$/) jamKeluar!: string;
  @IsDateString() tanggalKembali!: string;
  @Matches(/^\d{2}:\d{2}$/) jamKembali!: string;
}
