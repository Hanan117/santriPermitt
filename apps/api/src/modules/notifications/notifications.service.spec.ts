import { describe, it, expect, vi } from 'vitest';
import { NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  it('should create notification', async () => {
    const prisma = {
      notification: {
        create: vi.fn().mockImplementation(({ data }: any) => Promise.resolve({ id: '1', title: data.title })),
      },
    };
    const svc = new NotificationsService(prisma as any);
    const n = await svc.create({
      userId: 'u1',
      title: 'Izin Baru',
      message: 'Ahmad mengajukan KELUAR',
      type: 'new_request',
      relatedId: 'p1',
    });
    expect(n.title).toBe('Izin Baru');
  });

  it('should mark read only own notification', async () => {
    const prisma = {
      notification: { findUnique: vi.fn().mockResolvedValue({ id: '1', userId: 'u2' }), update: vi.fn() },
    };
    const svc = new NotificationsService(prisma as any);
    await expect(svc.markRead('1', 'u1')).rejects.toThrow();
  });

  it('should find notifications by user ordered desc', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { notification: { findMany } };
    const svc = new NotificationsService(prisma as any);
    await svc.findByUser('u1');
    expect(findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } });
  });

  it('should mark all read', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = { notification: { updateMany } };
    const svc = new NotificationsService(prisma as any);
    await svc.markAllRead('u1');
    expect(updateMany).toHaveBeenCalledWith({ where: { userId: 'u1', isRead: false }, data: { isRead: true } });
  });
});
