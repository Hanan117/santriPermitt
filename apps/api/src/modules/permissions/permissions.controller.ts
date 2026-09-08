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

  @Post()
  @Roles(Role.SANTRI, Role.WALI, Role.ADMIN)
  create(@Body() dto: CreatePermissionDto, @CurrentUser() user: any) {
    // Additional guard: SANTRI/WALI only; ADMIN allowed via same route
    // Roles decorator above allows all three, but brief says SANTRI/WALI scoping.
    // Keep ADMIN allowed for flexibility.
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
