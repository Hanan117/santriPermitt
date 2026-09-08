import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { SantriService } from './santri.service.js';
import { CreateSantriDto } from './dto/create-santri.dto.js';
import { UpdateSantriDto } from './dto/update-santri.dto.js';

@Controller('santri')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SantriController {
  constructor(private santriService: SantriService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateSantriDto) {
    return this.santriService.create(dto);
  }

  @Get()
  findAll() {
    return this.santriService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.santriService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSantriDto) {
    return this.santriService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.santriService.remove(id);
  }
}
