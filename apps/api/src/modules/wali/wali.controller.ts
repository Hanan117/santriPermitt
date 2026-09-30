import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { WaliService } from './wali.service.js';
import { LinkWaliDto } from './dto/link-wali.dto.js';

@Controller('wali')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WaliController {
  constructor(private waliService: WaliService) {}

  @Post('link')
  @Roles(Role.ADMIN)
  link(@Body() dto: LinkWaliDto) {
    return this.waliService.link(dto.santriId, dto.waliUserId, dto.hubungan ?? 'Wali');
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.waliService.findAll();
  }

  @Delete(':santriId/:waliUserId')
  @Roles(Role.ADMIN)
  unlink(@Param('santriId') santriId: string, @Param('waliUserId') waliUserId: string) {
    return this.waliService.unlink(santriId, waliUserId);
  }

  @Get('anak-saya')
  @Roles(Role.WALI, Role.ADMIN)
  anakSaya(@CurrentUser() user: any) {
    return this.waliService.findAnakSaya(user.id);
  }
}
