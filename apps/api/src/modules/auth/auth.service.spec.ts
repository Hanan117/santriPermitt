import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
describe('AuthService', () => {
  let service: AuthService;
  let prisma: any; let jwt: any;
  beforeEach(() => {
    prisma = { user: { findFirst: vi.fn() } };
    jwt = { sign: vi.fn().mockReturnValue('token') };
    service = new AuthService(prisma, jwt);
  });
  it('should fail login with wrong password', async () => {
    prisma.user.findFirst.mockResolvedValue({ id:'1', username:'admin', password: await (await import('bcrypt')).hash('correct',10), role:'ADMIN' });
    await expect(service.login({ usernameOrEmail:'admin', password:'wrong' })).rejects.toThrow();
  });
  it('should login with correct password', async () => {
    const hash = await (await import('bcrypt')).hash('pass123',10);
    prisma.user.findFirst.mockResolvedValue({ id:'1', username:'admin', email:'a@a.id', password: hash, role:'ADMIN', santriId:null });
    const res = await service.login({ usernameOrEmail:'admin', password:'pass123' });
    expect(res.access_token).toBe('token');
    expect(res.user.username).toBe('admin');
  });

  it('should register SANTRI as unlinked account', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create = vi.fn().mockResolvedValue({ id:'2', username:'baru', email:'b@b.id', role:'SANTRI', santriId:null });
    const res = await service.register({ username:'baru', email:'b@b.id', password:'pass123', role:'SANTRI' });
    expect(res.user.santriId).toBeNull();
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ username:'baru', role:'SANTRI', santriId:null }) }),
    );
  });

  it('should not return access_token on register (must login manually)', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create = vi.fn().mockResolvedValue({ id:'3', username:'baru2', email:'c@c.id', role:'WALI', santriId:null });
    const res: any = await service.register({ username:'baru2', email:'c@c.id', password:'pass123', role:'WALI' });
    expect(res.access_token).toBeUndefined();
    expect(jwt.sign).not.toHaveBeenCalled();
    expect(res.user.username).toBe('baru2');
  });

  it('should reject ADMIN role on self-register', async () => {
    await expect(service.register({ username:'x', email:'x@x.id', password:'pass123', role:'ADMIN' })).rejects.toThrow();
  });

  it('should reject duplicate username on register', async () => {
    prisma.user.findFirst.mockResolvedValue({ id:'1', username:'baru' });
    await expect(service.register({ username:'baru', email:'b@b.id', password:'pass123', role:'SANTRI' })).rejects.toThrow();
  });
});
