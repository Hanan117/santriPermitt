import { describe, it, expect, vi } from 'vitest';
import { WaliService } from './wali.service.js';

describe('WaliService', () => {
  it('links a WALI user to a santri with hubungan', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'w1', role: 'WALI' }) },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
      waliSantri: { upsert: vi.fn().mockResolvedValue({ santriId: 's1', waliUserId: 'w1', hubungan: 'Ayah' }) },
    };
    const svc = new WaliService(prisma as any);
    const res = await svc.link('s1', 'w1', 'Ayah');
    expect(res.santriId).toBe('s1');
    expect(res.waliUserId).toBe('w1');
  });

  it('returns anak list for a wali (anak-saya)', async () => {
    const prisma = {
      waliSantri: {
        findMany: vi.fn().mockResolvedValue([{ santriId: 's1', santri: { id: 's1', nama: 'Ahmad' } }]),
      },
    };
    const svc = new WaliService(prisma as any);
    const res = await svc.findAnakSaya('w1');
    expect(res.length).toBe(1);
    expect((res[0] as any).santri.nama).toBe('Ahmad');
  });

  it('persists hubungan on link (contract for admin UI)', async () => {
    const upsert = vi.fn().mockResolvedValue({ santriId: 's1', waliUserId: 'w1', hubungan: 'Ayah' });
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'w1', role: 'WALI' }) },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
      waliSantri: { upsert },
    };
    const svc = new WaliService(prisma as any);
    const res = await svc.link('s1', 'w1', 'Ayah');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ santriId: 's1', waliUserId: 'w1', hubungan: 'Ayah' }),
        update: expect.objectContaining({ hubungan: 'Ayah' }),
      }),
    );
    expect((res as any).hubungan).toBe('Ayah');
  });

  it('removes pivot row on unlink (compensation path)', async () => {
    const del = vi.fn().mockResolvedValue({ santriId: 's1', waliUserId: 'w1' });
    const prisma = {
      waliSantri: { delete: del },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'w1', santriId: 's1' }),
        update: vi.fn().mockResolvedValue({ id: 'w1', santriId: null }),
      },
    };
    const svc = new WaliService(prisma as any);
    await svc.unlink('s1', 'w1');
    expect(del).toHaveBeenCalledWith({
      where: { santriId_waliUserId: { santriId: 's1', waliUserId: 'w1' } },
    });
  });
  it('clears User.santriId on unlink when it matches', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'w1', santriId: null });
    const prisma = {
      waliSantri: { delete: vi.fn().mockResolvedValue({ santriId: 's1', waliUserId: 'w1' }) },
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'w1', santriId: 's1' }),
        update,
      },
    };
    const svc = new WaliService(prisma as any);
    await svc.unlink('s1', 'w1');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: { santriId: null },
    });
  });
  it('lists all wali links with santri for admin', async () => {
    const findMany = vi.fn().mockResolvedValue([
      { santriId: 's1', waliUserId: 'w1', hubungan: 'Ayah', santri: { id: 's1', nama: 'Ahmad' } },
    ]);
    const prisma = { waliSantri: { findMany } };
    const svc = new WaliService(prisma as any);
    const res = await svc.findAll();
    expect(findMany).toHaveBeenCalled();
    expect(res.length).toBe(1);
  });
  it('rejects linking non-WALI user', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'a1', role: 'ADMIN' }) },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
      waliSantri: { upsert: vi.fn() },
    };
    const svc = new WaliService(prisma as any);
    await expect(svc.link('s1', 'a1', 'Ayah')).rejects.toThrow();
  });
});
