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
    // Scoping: SANTRI/WALI must match own santriId
    if (currentUser.role === 'SANTRI' || currentUser.role === 'WALI') {
      if (dto.santriId !== currentUser.santriId) {
        throw new ForbiddenException('Cannot create permission for other santri');
      }
    }

    if (new Date(dto.tanggalKeluar) > new Date(dto.tanggalKembali)) {
      throw new BadRequestException('tanggalKeluar must be <= tanggalKembali');
    }

    // Fetch santri for notification message
    const santri = await (this.prisma as any).santri.findUnique({
      where: { id: dto.santriId },
    });

    const permission = await (this.prisma as any).permission.create({
      data: {
        santriId: dto.santriId,
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
      const name = santri?.nama ?? dto.santriId;
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

    if (currentUser.role === 'SANTRI' || currentUser.role === 'WALI') {
      if (query.santriId && query.santriId !== currentUser.santriId) {
        throw new ForbiddenException('Cannot query other santri permissions');
      }
      where.santriId = currentUser.santriId;
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
    if (
      (currentUser.role === 'SANTRI' || currentUser.role === 'WALI') &&
      permission.santriId !== currentUser.santriId
    ) {
      throw new ForbiddenException('Access denied');
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

    // Notify users linked to santri
    const users = await (this.prisma as any).user.findMany({
      where: { santriId: permission.santriId },
    });
    if (users.length > 0) {
      await this.notificationsService.createMany(
        users.map((u: any) => ({
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
    if (users.length > 0) {
      await this.notificationsService.createMany(
        users.map((u: any) => ({
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
}
