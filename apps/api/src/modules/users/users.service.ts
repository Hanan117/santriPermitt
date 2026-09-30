import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      select: { id: true, email: true, username: true, role: true, santriId: true, phone: true, avatar: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, role: true, santriId: true, phone: true, avatar: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(userId: string, dto: { email?: string; username?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.username && dto.username !== user.username) {
      const exists = await this.prisma.user.findUnique({ where: { username: dto.username } });
      if (exists) throw new BadRequestException('Username already taken');
    }
    if (dto.email && dto.email !== user.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new BadRequestException('Email already taken');
    }
    const data: any = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.phone !== undefined) data.phone = dto.phone;
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, username: true, role: true, santriId: true, phone: true, avatar: true },
    });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, email: true, username: true, role: true, santriId: true, phone: true, avatar: true },
    });
  }

  async deleteMe(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(password, (user as any).password);
    if (!valid) throw new BadRequestException('Password salah');
    await this.prisma.$transaction(async (tx) => {
      await (tx as any).waliSantri.deleteMany({ where: { waliUserId: userId } });
      await (tx as any).notification.deleteMany({ where: { userId } });
      await (tx as any).contactMessage.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
    return { message: 'Akun berhasil dihapus' };
  }

  async linkSantri(id: string, santriId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if ((user as any).role === Role.ADMIN) {
      throw new ForbiddenException('Cannot link ADMIN account to santri');
    }
    const s = await this.prisma.santri.findUnique({ where: { id: santriId } });
    if (!s) throw new NotFoundException('Santri not found');
    return this.prisma.user.update({
      where: { id },
      data: { santriId },
      select: { id: true, email: true, username: true, role: true, santriId: true },
    });
  }
}
