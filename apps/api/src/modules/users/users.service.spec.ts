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
});
