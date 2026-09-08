import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: { id: string; role: string; santriId: string | null },
  ) {
    if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('Forbidden');
    }
    return this.usersService.findOne(id);
  }
}
