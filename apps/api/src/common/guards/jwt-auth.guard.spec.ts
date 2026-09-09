import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard.js';

describe('JwtAuthGuard', () => {
  it('should instantiate without AuthModuleOptions provider (optional dep)', async () => {
    const mod = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();
    const guard = mod.get(JwtAuthGuard);
    expect(guard).toBeDefined();
  });
});
