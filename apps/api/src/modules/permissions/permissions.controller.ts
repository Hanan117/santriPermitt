import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PermissionsService } from './permissions.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { RejectPermissionDto } from './dto/reject-permission.dto.js';
import { QueryPermissionDto } from './dto/query-permission.dto.js';

@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  getStats() {
    return this.permissionsService.getStats();
  }

  @Post()
  @Roles(Role.SANTRI, Role.ADMIN)
  create(@Body() dto: CreatePermissionDto, @CurrentUser() user: any) {
    // WALI is read-only (monitor + notifications); only SANTRI/ADMIN may create.
    // Service also enforces this with a 403 for defense in depth.
    return this.permissionsService.create(dto, user);
  }

  @Get()
  findAll(@Query() query: QueryPermissionDto, @CurrentUser() user: any) {
    return this.permissionsService.findAll(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.permissionsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.permissionsService.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  reject(@Param('id') id: string, @Body() dto: RejectPermissionDto, @CurrentUser() user: any) {
    return this.permissionsService.reject(id, dto.reason, user);
  }
}
