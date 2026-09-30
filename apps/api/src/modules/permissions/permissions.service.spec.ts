import { describe, it, expect, vi } from 'vitest';
import { PermissionsService } from './permissions.service.js';

function makeSvc() {
  const findMany = vi.fn().mockResolvedValue([]);
  const count = vi.fn().mockResolvedValue(0);
  const prisma = { permission: { findMany, count } };
  const notifications = { createMany: vi.fn() };
  const svc = new PermissionsService(prisma as any, notifications as any);
  return { svc, findMany, count };
}

describe('PermissionsService.create', () => {
  it('should forbid WALI from creating permissions', async () => {
    const { svc } = makeSvc();
    await expect(
      svc.create(
        {
          jenisIzin: 'KELUAR',
          tujuan: 'Pulang',
          alasan: 'Keluarga',
          tanggalKeluar: '2026-09-12',
          jamKeluar: '08:00',
          tanggalKembali: '2026-09-13',
          jamKembali: '17:00',
        } as any,
        { id: 'u1', role: 'WALI', santriId: 's1' },
      ),
    ).rejects.toThrow('Wali tidak dapat mengajukan izin');
  });
});

describe('PermissionsService.findAll', () => {
  it('should return empty page for SANTRI/WALI without santriId instead of crashing', async () => {
    const { svc, findMany, count } = makeSvc();
    const res = await svc.findAll({}, { id: 'u1', role: 'WALI', santriId: null });
    expect(res).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    expect(findMany).not.toHaveBeenCalled();
    expect(count).not.toHaveBeenCalled();
  });

  it('should still scope by santriId when present', async () => {
    const { svc, findMany } = makeSvc();
    await svc.findAll({ status: 'MENUNGGU' as any }, { id: 'u1', role: 'WALI', santriId: 's1' });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'MENUNGGU', santriId: 's1' } }),
    );
  });

  it('should apply server-side search across santri nama and tujuan', async () => {
    const { svc, findMany } = makeSvc();
    await svc.findAll({ search: 'ahmad' } as any, { id: 'a1', role: 'ADMIN', santriId: null });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
    );
  });

  it('should apply date range filter on createdAt', async () => {
    const { svc, findMany } = makeSvc();
    await svc.findAll(
      { tanggalDari: '2026-09-01', tanggalSampai: '2026-09-30' } as any,
      { id: 'a1', role: 'ADMIN', santriId: null },
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }) }),
      }),
    );
  });
});
