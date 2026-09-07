import { describe, it, expect } from 'vitest';
import { PrismaService } from './prisma.service.js';
describe('PrismaService', () => {
  it('should be defined', () => { expect(new PrismaService()).toBeDefined(); });
  it('should have $connect', () => { expect(typeof new PrismaService().$connect).toBe('function'); });
});
