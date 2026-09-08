import { describe, it, expect, vi } from 'vitest';
import { SantriService } from './santri.service.js';

describe('SantriService', () => {
  it('should create santri', async () => {
    const prisma = { santri: { create: vi.fn().mockResolvedValue({ id: '1', nis: 'N1' }) } };
    const svc = new SantriService(prisma as any);
    const res = await svc.create({ nis: 'N1', nama: 'Ahmad', kelas: 'XII', kamar: 'A1' });
    expect(res.nis).toBe('N1');
  });
  it('should fail duplicate nis (prisma P2002)', async () => {
    const prisma = { santri: { create: vi.fn().mockRejectedValue({ code: 'P2002' }) } };
    const svc = new SantriService(prisma as any);
    await expect(svc.create({ nis: 'N1', nama: 'A', kelas: 'X', kamar: '1' })).rejects.toThrow();
  });
});
