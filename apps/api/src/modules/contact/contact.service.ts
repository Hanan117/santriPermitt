import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateContactDto } from './dto/contact.dto.js';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateContactDto, userId?: string) {
    return (this.prisma as any).contactMessage.create({
      data: {
        userId,
        nama: dto.nama,
        email: dto.email ?? null,
        pesan: dto.pesan,
        status: 'NEW',
      },
    });
  }

  async findAll() {
    return (this.prisma as any).contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return (this.prisma as any).contactMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}