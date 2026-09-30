import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteMeDto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}
