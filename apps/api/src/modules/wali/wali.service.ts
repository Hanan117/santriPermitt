import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class WaliService {
  constructor(private prisma: PrismaService) {}

  async link(santriId: string, waliUserId: string, hubungan = 'Wali') {
    const user = await (this.prisma as any).user.findUnique({ where: { id: waliUserId } });
    if (!user) throw new NotFoundException('User not found');
    if ((user as any).role !== 'WALI') {
      throw new ForbiddenException('Hanya akun WALI yang dapat ditautkan sebagai wali');
    }
    const santri = await (this.prisma as any).santri.findUnique({ where: { id: santriId } });
    if (!santri) throw new NotFoundException('Santri not found');
    return (this.prisma as any).waliSantri.upsert({
      where: { santriId_waliUserId: { santriId, waliUserId } },
      create: { santriId, waliUserId, hubungan },
      update: { hubungan },
    });
  }

  async unlink(santriId: string, waliUserId: string) {
    const deleted = await (this.prisma as any).waliSantri.delete({
      where: { santriId_waliUserId: { santriId, waliUserId } },
    });
    try {
      const user = await (this.prisma as any).user.findUnique({ where: { id: waliUserId } });
      if (user && (user as any).santriId === santriId) {
        await (this.prisma as any).user.update({ where: { id: waliUserId }, data: { santriId: null } });
      }
    } catch {
      // pivot sudah terhapus; jangan gagalkan unlink bila reset legacy gagal
    }
    return deleted;
  }

  async findAll() {
    return (this.prisma as any).waliSantri.findMany({
      include: { santri: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAnakSaya(waliUserId: string) {
    return (this.prisma as any).waliSantri.findMany({
      where: { waliUserId },
      include: { santri: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Dual-lookup: santriId langsung (legacy) + pivot WaliSantri. Additive, tidak menghapus perilaku lama. */
  async resolveSantriIds(userId: string, santriId: string | null): Promise<string[]> {
    const ids = new Set<string>();
    if (santriId) ids.add(santriId);
    const links = await (this.prisma as any).waliSantri.findMany({ where: { waliUserId: userId } });
    for (const l of links as any[]) ids.add((l as any).santriId);
    return [...ids];
  }
}
