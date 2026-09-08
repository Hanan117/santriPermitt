import { IsString, IsOptional } from 'class-validator';

export class CreateSantriDto {
  @IsString()
  nis!: string;

  @IsString()
  nama!: string;

  @IsString()
  kelas!: string;

  @IsString()
  kamar!: string;

  @IsOptional()
  @IsString()
  foto?: string;

  @IsOptional()
  @IsString()
  alamat?: string;

  @IsOptional()
  @IsString()
  noHp?: string;
}
