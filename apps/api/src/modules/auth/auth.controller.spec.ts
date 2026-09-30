import { describe, it, expect, vi } from 'vitest';
import { AuthController } from './auth.controller.js';

function mockAuth(overrides: any = {}) {
  return {
    getMe: vi.fn().mockImplementation(async (id: string) => ({
      id,
      username: 'user_' + id,
      email: id + '@test.id',
      role: overrides.role ?? 'SANTRI',
      santriId: overrides.santriId ?? null,
      avatar: null,
      phone: null,
      ...overrides,
    })),
  } as any;
}

describe('AuthController.me', () => {
  it('marks WALI with pivot-linked children as linked', async () => {
    const wali = { findAnakSaya: vi.fn().mockResolvedValue([{ santriId: 's1' }]) };
    const auth = mockAuth({ role: 'WALI', santriId: null });
    const ctrl = new AuthController(auth as any, wali as any);
    const res: any = await ctrl.me({ id: 'w1', role: 'WALI', santriId: null });
    expect(res.linked).toBe(true);
  });

  it('marks WALI without children as unlinked', async () => {
    const wali = { findAnakSaya: vi.fn().mockResolvedValue([]) };
    const auth = mockAuth({ role: 'WALI', santriId: null });
    const ctrl = new AuthController(auth as any, wali as any);
    const res: any = await ctrl.me({ id: 'w2', role: 'WALI', santriId: null });
    expect(res.linked).toBe(false);
  });

  it('keeps SANTRI rule based on santriId', async () => {
    const wali = { findAnakSaya: vi.fn() };
    const authLinked = mockAuth({ role: 'SANTRI', santriId: 'santri-1' });
    const authUnlinked = mockAuth({ role: 'SANTRI', santriId: null });
    const ctrl1 = new AuthController(authLinked as any, wali as any);
    const ctrl2 = new AuthController(authUnlinked as any, wali as any);
    const linked: any = await ctrl1.me({ id: 's1', role: 'SANTRI', santriId: 'santri-1' });
    const unlinked: any = await ctrl2.me({ id: 's2', role: 'SANTRI', santriId: null });
    expect(linked.linked).toBe(true);
    expect(unlinked.linked).toBe(false);
    expect(wali.findAnakSaya).not.toHaveBeenCalled();
  });
});
