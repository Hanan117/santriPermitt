import { IsString } from 'class-validator';

export class LinkSantriDto {
  @IsString()
  santriId!: string;
}
