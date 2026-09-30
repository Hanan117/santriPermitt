import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: string;
  relatedId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: { ...dto } });
  }

  createMany(dtos: CreateNotificationDto[]) {
    return this.prisma.notification.createMany({ data: dtos });
  }

  findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string, userId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new ForbiddenException();
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  deleteRead(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }

  async deleteOne(id: string, userId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== userId) throw new ForbiddenException();
    return this.prisma.notification.delete({ where: { id } });
  }
}
