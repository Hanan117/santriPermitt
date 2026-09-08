import { IsString, IsNotEmpty } from 'class-validator';

export class RejectPermissionDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
