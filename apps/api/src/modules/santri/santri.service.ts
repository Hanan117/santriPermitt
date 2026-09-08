import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSantriDto } from './dto/create-santri.dto.js';
import { UpdateSantriDto } from './dto/update-santri.dto.js';

@Injectable()
export class SantriService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSantriDto) {
    try {
      return await this.prisma.santri.create({ data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('NIS already exists');
      throw e;
    }
  }

  async findAll() {
    return this.prisma.santri.findMany();
  }

  async findOne(id: string) {
    const santri = await this.prisma.santri.findUnique({ where: { id } });
    if (!santri) throw new NotFoundException('Santri not found');
    return santri;
  }

  async update(id: string, dto: UpdateSantriDto) {
    try {
      return await this.prisma.santri.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('NIS already exists');
      if (e?.code === 'P2025') throw new NotFoundException('Santri not found');
      throw e;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.santri.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new NotFoundException('Santri not found');
      throw e;
    }
  }
}
