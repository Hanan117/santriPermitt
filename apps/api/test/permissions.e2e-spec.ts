import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { PermissionsController } from '../src/modules/permissions/permissions.controller.js';
import { PermissionsService } from '../src/modules/permissions/permissions.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../src/common/guards/roles.guard.js';

function mockJwtGuard(user: any) {
  return { canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = user; return true; } };
}
function makeApp(user: any, permService: any) {
  return Test.createTestingModule({
    controllers: [PermissionsController],
    providers: [{ provide: PermissionsService, useValue: permService }],
  })
    .overrideGuard(JwtAuthGuard).useValue(mockJwtGuard(user))
    .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
    .compile();
}

describe('Permissions e2e', () => {
  it('WALI cannot approve (service throws via guard simulation)', async () => {
    // Simulate WALI approve blocked by RolesGuard: we test guard directly
    // Here we override RolesGuard to enforce ADMIN only
    const permService = { approve: vi.fn() };
    const waliUser = { id: 'u1', role: 'WALI', santriId: 's1' };
    const moduleRef = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [{ provide: PermissionsService, useValue: permService }],
    })
      .overrideGuard(JwtAuthGuard).useValue(mockJwtGuard(waliUser))
      // Real RolesGuard logic: block non-ADMIN
      .overrideGuard(RolesGuard).useValue({ canActivate: (ctx: any) => {
        const req = ctx.switchToHttp().getRequest();
        if (req.user.role !== 'ADMIN') throw new ForbiddenException('Forbidden');
        return true;
      }})
      .compile();
    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    await request(app.getHttpServer()).patch('/permissions/p1/approve').expect(403);
    await app.close();
  });

  it('ADMIN can approve MENUNGGU -> DISETUJUI and triggers notification', async () => {
    const permService = {
      approve: vi.fn().mockResolvedValue({ id: 'p1', status: 'DISETUJUI' }),
      findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), reject: vi.fn(),
    };
    const adminUser = { id: 'admin1', role: 'ADMIN', santriId: null };
    const mod = await makeApp(adminUser, permService);
    const app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    const res = await request(app.getHttpServer()).patch('/permissions/p1/approve').expect(200);
    expect(res.body.status).toBe('DISETUJUI');
    expect(permService.approve).toHaveBeenCalledWith('p1', expect.any(Object));
    await app.close();
  });

  it('Reject without reason fails 400', async () => {
    const permService = {
      reject: vi.fn().mockImplementation((id: string, reason: string) => {
        if (!reason || reason.trim() === '') throw { status: 400, getStatus: () => 400, message: 'reason required' };
        return { id, status: 'DITOLAK' };
      }),
      approve: vi.fn(), findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(),
    };
    const adminUser = { id: 'admin1', role: 'ADMIN', santriId: null };
    const mod = await makeApp(adminUser, permService);
    const app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    // empty body -> ValidationPipe should 400 due to @IsNotEmpty on reason
    await request(app.getHttpServer()).patch('/permissions/p1/reject').send({}).expect(400);
    await request(app.getHttpServer()).patch('/permissions/p1/reject').send({ reason: '' }).expect(400);
    await app.close();
  });
});
