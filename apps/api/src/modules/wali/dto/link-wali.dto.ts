import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LinkWaliDto {
  @IsString()
  @IsNotEmpty()
  santriId!: string;

  @IsString()
  @IsNotEmpty()
  waliUserId!: string;

  @IsString()
  @IsOptional()
  hubungan?: string;
}
