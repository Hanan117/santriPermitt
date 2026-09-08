import { describe, it, expect, vi } from 'vitest';
import { PermissionsService } from './permissions.service.js';

describe('PermissionsService', () => {
  it('should reject SANTRI creating for other santriId', async () => {
    const prisma = { permission: { create: vi.fn() }, santri: { findUnique: vi.fn() }, user: { findMany: vi.fn().mockResolvedValue([]) } };
    const svc = new PermissionsService(prisma as any, { createMany: vi.fn() } as any);
    await expect(
      svc.create(
        {
          santriId: 'other',
          jenisIzin: 'KELUAR',
          tujuan: 'Rumah',
          alasan: 'Sakit',
          tanggalKeluar: new Date().toISOString(),
          jamKeluar: '08:00',
          tanggalKembali: new Date().toISOString(),
          jamKembali: '17:00',
        } as any,
        { id: 'u1', role: 'SANTRI', santriId: 'own' } as any,
      ),
    ).rejects.toThrow();
  });
  it('should allow ADMIN to approve MENUNGGU', async () => {
    const prisma = {
      permission: {
        findUnique: vi.fn().mockResolvedValue({ id: 'p1', status: 'MENUNGGU', santriId: 's1', jenisIzin: 'KELUAR' }),
        update: vi.fn().mockResolvedValue({ id: 'p1', status: 'DISETUJUI' }),
      },
      user: { findMany: vi.fn().mockResolvedValue([{ id: 'uW' }]) },
      santri: { findUnique: vi.fn() },
    };
    const notif = { createMany: vi.fn().mockResolvedValue({}) };
    const svc = new PermissionsService(prisma as any, notif as any);
    const res = await svc.approve('p1', { id: 'admin1', role: 'ADMIN' } as any);
    expect(res.status).toBe('DISETUJUI');
  });
  it('should fail approve if status not MENUNGGU', async () => {
    const prisma = {
      permission: { findUnique: vi.fn().mockResolvedValue({ id: 'p1', status: 'DISETUJUI' }) },
    };
    const svc = new PermissionsService(prisma as any, { createMany: vi.fn() } as any);
    await expect(svc.approve('p1', { id: 'admin1', role: 'ADMIN' } as any)).rejects.toThrow();
  });
  it('should require reason on reject', async () => {
    const prisma = {
      permission: { findUnique: vi.fn().mockResolvedValue({ id: 'p1', status: 'MENUNGGU' }) },
      user: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const svc = new PermissionsService(prisma as any, { createMany: vi.fn() } as any);
    await expect(svc.reject('p1', '', { id: 'admin1' } as any)).rejects.toThrow();
  });
});
