import { PartialType } from '@nestjs/mapped-types';
import { CreateSantriDto } from './create-santri.dto.js';

export class UpdateSantriDto extends PartialType(CreateSantriDto) {}
