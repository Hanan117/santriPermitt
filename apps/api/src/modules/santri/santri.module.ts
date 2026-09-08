import { Module } from '@nestjs/common';
import { SantriService } from './santri.service.js';
import { SantriController } from './santri.controller.js';

@Module({
  controllers: [SantriController],
  providers: [SantriService],
  exports: [SantriService],
})
export class SantriModule {}
