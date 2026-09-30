import { Module } from '@nestjs/common';
import { WaliService } from './wali.service.js';
import { WaliController } from './wali.controller.js';

@Module({
  controllers: [WaliController],
  providers: [WaliService],
  exports: [WaliService],
})
export class WaliModule {}
