import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    if ((dto.role === Role.SANTRI || dto.role === Role.WALI) && !dto.santriId) {
      throw new BadRequestException('santriId required for SANTRI/WALI');
    }
    if (dto.santriId) {
      const s = await this.prisma.santri.findUnique({ where: { id: dto.santriId } });
      if (!s) throw new NotFoundException('Santri not found');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hash,
        role: dto.role,
        santriId: dto.santriId ?? null,
      },
      select: { id: true, email: true, username: true, role: true, santriId: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true, santriId: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, role: true, santriId: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
