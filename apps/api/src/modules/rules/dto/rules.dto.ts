import { IsString, IsOptional } from 'class-validator';

export class UpdateRulesDto {
  @IsOptional() @IsString() rulesPdf?: string;
  @IsOptional() @IsString() cs_whatsapp?: string;
  // allow any other rule keys dynamically
  [key: string]: string | undefined;
}

export class RuleResponseDto {
  key: string;
  value: string;
  description: string;
}
