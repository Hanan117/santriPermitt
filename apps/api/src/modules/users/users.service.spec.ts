import { describe, it, expect, vi } from 'vitest';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  it('should hash password on create', async () => {
    const prisma = {
      user: { create: vi.fn().mockResolvedValue({ id: '1' }), findUnique: vi.fn() },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
    };
    const svc = new UsersService(prisma as any);
    await svc.create({
      email: 'a@a.id',
      username: 'u1',
      password: 'pass123',
      role: 'SANTRI' as any,
      santriId: 's1',
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: expect.not.stringContaining('pass123') }),
      }),
    );
  });
  it('should reject invalid santriId for SANTRI', async () => {
    const prisma = {
      user: {},
      santri: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const svc = new UsersService(prisma as any);
    await expect(
      svc.create({
        email: 'a@a.id',
        username: 'u1',
        password: 'pass123',
        role: 'SANTRI' as any,
        santriId: 'bad',
      }),
    ).rejects.toThrow();
  });

  it('should link user to existing santri', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'u1', santriId: 's1' });
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', role: 'SANTRI' }), update },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
    };
    const svc = new UsersService(prisma as any);
    const res = await svc.linkSantri('u1', 's1');
    expect(res.santriId).toBe('s1');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { santriId: 's1' },
      select: { id: true, email: true, username: true, role: true, santriId: true },
    });
  });

  it('should reject linking to missing santri', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', role: 'SANTRI' }) },
      santri: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const svc = new UsersService(prisma as any);
    await expect(svc.linkSantri('u1', 'bad')).rejects.toThrow('Santri not found');
  });

  it('should reject linking ADMIN account', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', role: 'ADMIN' }) },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
    };
    const svc = new UsersService(prisma as any);
    await expect(svc.linkSantri('u1', 's1')).rejects.toThrow();
  });

  it('should reject linking missing user', async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(null) },
      santri: { findUnique: vi.fn().mockResolvedValue({ id: 's1' }) },
    };
    const svc = new UsersService(prisma as any);
    await expect(svc.linkSantri('nope', 's1')).rejects.toThrow('User not found');
  });
});
