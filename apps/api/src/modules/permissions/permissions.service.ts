import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { QueryPermissionDto } from './dto/query-permission.dto.js';

interface CurrentUser {
  id: string;
  role: string;
  santriId: string | null;
}

@Injectable()
export class PermissionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreatePermissionDto, currentUser: CurrentUser) {
    if (currentUser.role === 'WALI') {
      throw new ForbiddenException('Wali tidak dapat mengajukan izin. Minta santri mengajukan dari akunnya.');
    }
    // For SANTRI, auto-fill santriId from current user
    const santriId = currentUser.role === 'SANTRI'
      ? currentUser.santriId
      : dto.santriId;

    if (!santriId) {
      throw new BadRequestException(
        currentUser.role === 'SANTRI' || currentUser.role === 'WALI'
          ? 'Akun belum tertaut ke data santri, hubungi admin'
          : 'santriId is required',
      );
    }

    // Scoping: SANTRI must match own santriId
    if (currentUser.role === 'SANTRI') {
      if (santriId !== currentUser.santriId) {
        throw new ForbiddenException('Cannot create permission for other santri');
      }
    }

    if (new Date(dto.tanggalKeluar) > new Date(dto.tanggalKembali)) {
      throw new BadRequestException('tanggalKeluar must be <= tanggalKembali');
    }

    // Fetch santri for notification message
    const santri = await (this.prisma as any).santri.findUnique({
      where: { id: santriId },
    });

    const permission = await (this.prisma as any).permission.create({
      data: {
        santriId,
        jenisIzin: dto.jenisIzin,
        tujuan: dto.tujuan,
        alasan: dto.alasan,
        keterangan: dto.keterangan,
        tanggalKeluar: new Date(dto.tanggalKeluar),
        jamKeluar: dto.jamKeluar,
        tanggalKembali: new Date(dto.tanggalKembali),
        jamKembali: dto.jamKembali,
        status: 'MENUNGGU',
      },
    });

    // Notify all ADMIN users
    const admins = await (this.prisma as any).user.findMany({
      where: { role: 'ADMIN' },
    });
    if (admins.length > 0) {
      const name = santri?.nama ?? santriId;
      await this.notificationsService.createMany(
        admins.map((a: any) => ({
          userId: a.id,
          title: 'Pengajuan Izin Baru',
          message: `${name} mengajukan ${dto.jenisIzin}`,
          type: 'new_request',
          relatedId: permission.id,
        })),
      );
    }

    return permission;
  }

  async findAll(query: QueryPermissionDto, currentUser: CurrentUser) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.jenisIzin) where.jenisIzin = query.jenisIzin;

    // Server-side search: santri nama/NIS + tujuan/alasan. Additive, optional.
    const keyword = query.search?.trim();
    if (keyword) {
      where.OR = [
        { tujuan: { contains: keyword } },
        { alasan: { contains: keyword } },
        { santri: { is: { nama: { contains: keyword } } } },
        { santri: { is: { nis: { contains: keyword } } } },
      ];
    }

    // Date range on createdAt. Additive, optional; invalid dates ignored.
    if (query.tanggalDari || query.tanggalSampai) {
      const gte = query.tanggalDari ? new Date(query.tanggalDari) : undefined;
      let lte = query.tanggalSampai ? new Date(query.tanggalSampai) : undefined;
      // Sampai akhir hari agar filter tanggal intuitif
      if (lte && !Number.isNaN(lte.getTime())) lte = new Date(lte.getTime() + 24 * 60 * 60 * 1000 - 1);
      const range: any = {};
      if (gte && !Number.isNaN(gte.getTime())) range.gte = gte;
      if (lte && !Number.isNaN((query.tanggalSampai ? new Date(query.tanggalSampai) : undefined)?.getTime() ?? NaN)) range.lte = lte;
      if (Object.keys(range).length > 0) where.createdAt = range;
    }

    if (currentUser.role === 'SANTRI' || currentUser.role === 'WALI') {
      if (query.santriId && query.santriId !== currentUser.santriId) {
        // Allow WALI with pivot link to query linked santri (dual-lookup, additive)
        if (currentUser.role === 'WALI' && query.santriId) {
          const link = await (this.prisma as any).waliSantri?.findUnique?.({
            where: { santriId_waliUserId: { santriId: query.santriId, waliUserId: currentUser.id } },
          }).catch(() => null);
          if (!link) {
            throw new ForbiddenException('Cannot query other santri permissions');
          }
          where.santriId = query.santriId;
        } else {
          throw new ForbiddenException('Cannot query other santri permissions');
        }
      } else if (query.santriId) {
        where.santriId = query.santriId;
      } else {
        // User not linked to any santri yet: empty page instead of crashing
        // Prisma with `where: { santriId: null }` throws (must not be null).
        const linked = await (this.prisma as any).waliSantri?.findMany?.({
          where: { waliUserId: currentUser.id },
        }).catch(() => []);
        const ids = [...new Set([...(currentUser.santriId ? [currentUser.santriId] : []), ...((linked ?? []) as any[]).map((l: any) => l.santriId)])];
        if (ids.length === 0) {
          return { data: [], total: 0, page, limit };
        }
        where.santriId = ids.length === 1 ? ids[0] : { in: ids };
      }
    } else {
      if (query.santriId) where.santriId = query.santriId;
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { santri: true },
      }),
      (this.prisma as any).permission.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, currentUser: CurrentUser) {
    const permission = await (this.prisma as any).permission.findUnique({
      where: { id },
      include: { santri: true },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    if (currentUser.role === 'SANTRI' || currentUser.role === 'WALI') {
      const ownLink = permission.santriId === currentUser.santriId;
      if (!ownLink && currentUser.role === 'WALI') {
        const link = await (this.prisma as any).waliSantri?.findUnique?.({
          where: { santriId_waliUserId: { santriId: permission.santriId, waliUserId: currentUser.id } },
        }).catch(() => null);
        if (!link) throw new ForbiddenException('Access denied');
      } else if (!ownLink) {
        throw new ForbiddenException('Access denied');
      }
    }
    return permission;
  }

  async approve(id: string, currentUser: CurrentUser) {
    const permission = await (this.prisma as any).permission.findUnique({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    if (permission.status !== 'MENUNGGU') {
      throw new BadRequestException('Only MENUNGGU can be approved');
    }

    const updated = await (this.prisma as any).permission.update({
      where: { id },
      data: {
        status: 'DISETUJUI',
        approvedById: currentUser.id,
        approvedAt: new Date(),
      },
    });

    // Notify users linked to santri (legacy santriId + pivot WaliSantri, additive)
    const users = await (this.prisma as any).user.findMany({
      where: { santriId: permission.santriId },
    });
    const pivotLinks = await (this.prisma as any).waliSantri?.findMany?.({
      where: { santriId: permission.santriId },
    }).catch(() => []);
    const pivotIds = ((pivotLinks ?? []) as any[]).map((l: any) => l.waliUserId).filter(Boolean);
    const pivotUsers = pivotIds.length > 0
      ? await (this.prisma as any).user.findMany({ where: { id: { in: pivotIds } } })
      : [];
    const allUsers = [...users, ...pivotUsers].filter(
      (u: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === u.id) === i,
    );
    if (allUsers.length > 0) {
      await this.notificationsService.createMany(
        allUsers.map((u: any) => ({
          userId: u.id,
          title: 'Izin Disetujui',
          message: `Pengajuan izin ${permission.jenisIzin} telah disetujui`,
          type: 'approval',
          relatedId: id,
        })),
      );
    }

    return updated;
  }

  async reject(id: string, reason: string, currentUser: CurrentUser) {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }
    const permission = await (this.prisma as any).permission.findUnique({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    if (permission.status !== 'MENUNGGU') {
      throw new BadRequestException('Only MENUNGGU can be rejected');
    }

    const updated = await (this.prisma as any).permission.update({
      where: { id },
      data: {
        status: 'DITOLAK',
        rejectionReason: reason,
        approvedById: currentUser.id,
        approvedAt: new Date(),
      },
    });

    const users = await (this.prisma as any).user.findMany({
      where: { santriId: permission.santriId },
    });
    const pivotLinks = await (this.prisma as any).waliSantri?.findMany?.({
      where: { santriId: permission.santriId },
    }).catch(() => []);
    const pivotIds = ((pivotLinks ?? []) as any[]).map((l: any) => l.waliUserId).filter(Boolean);
    const pivotUsers = pivotIds.length > 0
      ? await (this.prisma as any).user.findMany({ where: { id: { in: pivotIds } } })
      : [];
    const allUsers = [...users, ...pivotUsers].filter(
      (u: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === u.id) === i,
    );
    if (allUsers.length > 0) {
      await this.notificationsService.createMany(
        allUsers.map((u: any) => ({
          userId: u.id,
          title: 'Izin Ditolak',
          message: `Pengajuan izin ${permission.jenisIzin} ditolak: ${reason}`,
          type: 'rejection',
          relatedId: id,
        })),
      );
    }

    return updated;
  }

  async getStats() {
    const [
      total,
      pending,
      approved,
      rejected,
      byJenis,
      byMonthRaw,
    ] = await Promise.all([
      (this.prisma as any).permission.count(),
      (this.prisma as any).permission.count({ where: { status: 'MENUNGGU' } }),
      (this.prisma as any).permission.count({ where: { status: 'DISETUJUI' } }),
      (this.prisma as any).permission.count({ where: { status: 'DITOLAK' } }),
      (this.prisma as any).permission.groupBy({ by: ['jenisIzin'], _count: { _all: true } }),
      (this.prisma as any).$queryRaw`
        SELECT to_char("createdAt", 'YYYY-MM') as month, count(*)::int as count
        FROM "Permission"
        WHERE "createdAt" >= (now() - interval '6 months')
        GROUP BY month
        ORDER BY month
      `,
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      byJenis: byJenis.map((b: any) => ({ jenis: b.jenisIzin, count: b._count._all })),
      byMonth: byMonthRaw.map((b: any) => ({ month: b.month, count: b.count })),
    };
  }
}
