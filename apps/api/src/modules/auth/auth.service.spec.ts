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
});
