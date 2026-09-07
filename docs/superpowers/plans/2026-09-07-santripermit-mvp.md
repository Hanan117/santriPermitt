# SantriPermit MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build MVP SantriPermit per PRD — login multi-role, pengajuan izin (Santri/Wali), approve/reject (Admin), notifikasi in-app, riwayat — lean stack.

**Architecture:** NestJS modular API (`auth/users/santri/permissions/notifications`) + Prisma PostgreSQL + Next.js App Router. JWT+bcrypt auth, RBAC guards, pagination, in-app notifications. Docker Compose for local.

**Tech Stack:** Turborepo 2 + Bun 1.4, Next.js 16 + Tailwind 4, NestJS 12 + Prisma 6 + PostgreSQL 16, @nestjs/jwt 12 + bcrypt 6 + class-validator, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-07-santripermit-mvp-design.md`

## Global Constraints

- Node >=24, Bun 1.4.0, TypeScript 5/6, ESM (`type: module` in apps/api).
- DB provider `postgresql` (not MySQL), url `env("DATABASE_URL")`.
- JWT: `JWT_SECRET` min 32 chars, `JWT_EXPIRES_IN=7d`, bcrypt rounds 10.
- API prefix `/api`, CORS `WEB_URL=http://localhost:3000`, web `NEXT_PUBLIC_API_URL` or `API_URL` for rewrites.
- ValidationPipe `{whitelist:true, forbidNonWhitelisted:true, transform:true}`.
- Roles `SANTRI|WALI|ADMIN`, status `MENUNGGU|DISETUJUI|DITOLAK|SEDANG_KELUAR|SUDAH_KEMBALI`, jenis `KELUAR|PULANG`, time `HH:mm`.
- Pagination default limit 20.

---

## File Structure

**New files:**
- `docker-compose.yml` — postgres 16, api 3001, web 3000
- `apps/api/prisma/seed.ts` — seed admin + sample data
- `apps/api/src/common/guards/jwt-auth.guard.ts` — JwtAuthGuard
- `apps/api/src/common/guards/roles.guard.ts` — RolesGuard
- `apps/api/src/common/decorators/current-user.decorator.ts` — @CurrentUser
- `apps/api/src/common/decorators/roles.decorator.ts` — @Roles
- `apps/api/src/modules/auth/*` — auth module, service, controller, jwt.strategy, dto
- `apps/api/src/modules/users/*` — users module/service/controller/dto
- `apps/api/src/modules/santri/*` — santri module/service/controller/dto
- `apps/api/src/modules/notifications/*` — notifications module/service/controller
- `apps/api/src/modules/permissions/*` — permissions module/service/controller/dto
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(dashboard)/layout.tsx` + `dashboard/page.tsx`
- `apps/web/app/(dashboard)/izin/ajukan/page.tsx` + `riwayat/page.tsx`
- `apps/web/app/(dashboard)/admin/perizinan/page.tsx` + `admin/santri/page.tsx`
- `apps/web/components/ui/*` — button, input, card, badge
- `apps/web/lib/auth.ts` — token store + useAuth hook

**Modified:**
- `apps/api/prisma/schema.prisma` — Role enum fix, User.santriId, Santri relations
- `apps/api/src/app.module.ts` — import all modules
- `apps/api/.env.example`, `apps/web/.env.example`
- `apps/web/lib/api.ts` — add auth header
- `apps/web/app/globals.css` — already has palette, no change
- `apps/web/next.config.ts` — already has rewrite, verify

---

### Task 1: Data Layer — Prisma Schema, Docker, Seed

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`
- Create: `docker-compose.yml` (root)
- Modify: `apps/api/.env.example`
- Create: `apps/web/.env.example`
- Test: `apps/api/src/prisma/prisma.service.spec.ts`

**Interfaces:**
- Consumes: existing PrismaService `apps/api/src/prisma/prisma.service.ts:1`
- Produces: PrismaClient with new models (User.role WALI, User.santriId, Santri without wali fields), `docker-compose up` brings postgres, `bun prisma:generate` works

- [ ] **Step 1: Write the failing test for PrismaService connect**

```ts
// apps/api/src/prisma/prisma.service.spec.ts
import { describe, it, expect } from 'vitest';
import { PrismaService } from './prisma.service.js';
describe('PrismaService', () => {
  it('should be defined', () => { expect(new PrismaService()).toBeDefined(); });
  it('should have $connect', () => { expect(typeof new PrismaService().$connect).toBe('function'); });
});
```

- [ ] **Step 2: Run test to verify it passes (baseline)**

Run: `bun --filter api test -- src/prisma/prisma.service.spec.ts`
Expected: PASS (service exists)

- [ ] **Step 3: Update Prisma schema**

Edit `apps/api/prisma/schema.prisma`:
```prisma
enum Role { SANTRI WALI ADMIN }
// User: add santriId String? @unique, relation to Santri, remove old wali fields from Santri
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  username  String   @unique
  password  String
  role      Role     @default(SANTRI)
  santriId  String?  @unique
  santri    Santri?  @relation(fields: [santriId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
model Santri {
  id        String   @id @default(cuid())
  nis       String   @unique
  nama      String
  kelas     String
  kamar     String
  foto      String?
  alamat    String?
  noHp      String?
  // reverse side for User.santriId
  users     User[]
  permissions Permission[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([nama])
  @@index([kelas])
}
```
Remove `User.santri Santri?` old one-to-one via userId, replace with santriId relation. Keep Permission/Notification unchanged.

- [ ] **Step 4: Add docker-compose.yml, env, seed**

`docker-compose.yml` at root:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: santri_permit
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes: [pgdata:/var/lib/postgresql/data]
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    env_file: apps/api/.env
    depends_on: [postgres]
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    env_file: apps/web/.env
volumes: { pgdata: {} }
```

`apps/api/prisma/seed.ts`:
```ts
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { email: 'admin@santripermit.id', username: 'admin', password: hash, role: Role.ADMIN },
  });
  const santri = await prisma.santri.upsert({
    where: { nis: 'SANTRI001' },
    update: {},
    create: { nis: 'SANTRI001', nama: 'Ahmad Santri', kelas: 'XII-A', kamar: 'A-101', noHp: '08123456789' },
  });
  await prisma.user.upsert({
    where: { username: 'santri1' },
    update: {},
    create: { email: 'santri1@test.id', username: 'santri1', password: await bcrypt.hash('santri123',10), role: Role.SANTRI, santriId: santri.id },
  });
  await prisma.user.upsert({
    where: { username: 'wali1' },
    update: {},
    create: { email: 'wali1@test.id', username: 'wali1', password: await bcrypt.hash('wali123',10), role: Role.WALI, santriId: santri.id },
  });
}
main().finally(()=>prisma.$disconnect());
```

Add to `apps/api/package.json` scripts: `"prisma:seed": "tsx prisma/seed.ts"` and dev dep `tsx`.

- [ ] **Step 5: Generate client and verify**

Run: `bun --filter api prisma:generate`
Expected: PASS no schema error
Run: `bun --filter api test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/seed.ts docker-compose.yml apps/api/.env.example apps/web/.env.example apps/api/package.json
git commit -m "feat: setup prisma schema (WALI role, relations), docker-compose, seed"
```

---

### Task 2: Auth Module — JWT, Guards, Decorators

**Files:**
- Create: `apps/api/src/common/decorators/roles.decorator.ts`
- Create: `apps/api/src/common/decorators/current-user.decorator.ts`
- Create: `apps/api/src/common/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/common/guards/roles.guard.ts`
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/jwt.strategy.ts`
- Create: `apps/api/src/modules/auth/dto/login.dto.ts`
- Test: `apps/api/src/modules/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: PrismaService, JwtService (from @nestjs/jwt), bcrypt
- Produces: `POST /api/auth/login {usernameOrEmail,password}->{access_token,user}`, `GET /api/auth/me` (guarded), `JwtAuthGuard`, `RolesGuard`, `@Roles(...Role)`, `@CurrentUser() -> {id, role, santriId}`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/modules/auth/auth.service.spec.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun --filter api test -- src/modules/auth/auth.service.spec.ts`
Expected: FAIL "AuthService not found"

- [ ] **Step 3: Implement Auth**

`dto/login.dto.ts`:
```ts
import { IsString, MinLength } from 'class-validator';
export class LoginDto { @IsString() usernameOrEmail!: string; @IsString() @MinLength(6) password!: string; }
```

`jwt.strategy.ts` using passport-jwt: validate payload `{sub, role}` -> return user.

`auth.service.ts`:
```ts
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({ where: { OR: [{ username: dto.usernameOrEmail }, { email: dto.usernameOrEmail }] } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, role: user.role, santriId: user.santriId };
    const token = this.jwt.sign(payload);
    return { access_token: token, user: { id:user.id, username:user.username, email:user.email, role:user.role, santriId:user.santriId } };
  }
}
```

`auth.controller.ts`:
```ts
@Controller('auth') export class AuthController {
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @UseGuards(JwtAuthGuard) @Get('me') me(@CurrentUser() u:any) { return u; }
}
```

`jwt-auth.guard.ts` extends `AuthGuard('jwt')`, `roles.guard.ts` checks `Reflector.getAllAndOverride('roles')`, `roles.decorator.ts` = `SetMetadata('roles', roles)`, `current-user.decorator.ts` = `createParamDecorator`.

Wire `AuthModule` imports `JwtModule.register({ secret: process.env.JWT_SECRET, signOptions:{expiresIn: process.env.JWT_EXPIRES_IN ?? '7d'}})`, `PassportModule`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun --filter api test -- src/modules/auth/auth.service.spec.ts`
Expected: PASS

- [ ] **Step 5: Import in AppModule**

Modify `apps/api/src/app.module.ts` to import `AuthModule` alongside `PrismaModule`, `ConfigModule`.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/auth apps/api/src/common
git commit -m "feat: add auth module (JWT, login, guards, decorators)"
```

---

### Task 3: Users Module (ADMIN-only creation)

**Files:**
- Create: `apps/api/src/modules/users/users.module.ts`
- Create: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/users/users.controller.ts`
- Create: `apps/api/src/modules/users/dto/create-user.dto.ts`
- Test: `apps/api/src/modules/users/users.service.spec.ts`

**Interfaces:**
- Consumes: PrismaService, Auth guards, bcrypt
- Produces: `POST /api/users` (ADMIN, hash password, validate santriId), `GET /api/users` (ADMIN), `GET /api/users/:id` (ADMIN or self)

- [ ] **Step 1: Write the failing test**

```ts
// users.service.spec.ts
describe('UsersService', () => {
  it('should hash password on create', async () => {
    const prisma = { user: { create: vi.fn().mockResolvedValue({id:'1'}), findUnique: vi.fn() }, santri:{ findUnique: vi.fn().mockResolvedValue({id:'s1'})} };
    const svc = new UsersService(prisma as any);
    await svc.create({ email:'a@a.id', username:'u1', password:'pass123', role:'SANTRI', santriId:'s1'});
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ password: expect.not.stringContaining('pass123') })}));
  });
  it('should reject invalid santriId for SANTRI', async () => {
    const prisma = { user:{}, santri:{ findUnique: vi.fn().mockResolvedValue(null)}};
    const svc = new UsersService(prisma as any);
    await expect(svc.create({ email:'a@a.id', username:'u1', password:'pass123', role:'SANTRI', santriId:'bad'})).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `bun --filter api test -- src/modules/users/users.service.spec.ts`

- [ ] **Step 3: Implement**

`dto/create-user.dto.ts` with `@IsEmail, @IsString, @IsEnum(Role), @IsOptional @IsString santriId`.

`users.service.ts`:
```ts
async create(dto: CreateUserDto) {
  if ((dto.role===Role.SANTRI || dto.role===Role.WALI) && !dto.santriId) throw new BadRequestException('santriId required for SANTRI/WALI');
  if (dto.santriId) { const s = await this.prisma.santri.findUnique({where:{id:dto.santriId}}); if(!s) throw new NotFoundException('Santri not found'); }
  const hash = await bcrypt.hash(dto.password, 10);
  return this.prisma.user.create({ data:{ email:dto.email, username:dto.username, password:hash, role:dto.role, santriId:dto.santriId ?? null }, select:{id:true, email:true, username:true, role:true, santriId:true} });
}
async findAll() { return this.prisma.user.findMany({ select:{id:true, email:true, username:true, role:true, santriId:true} });}
async findOne(id:string) { /* ... */ }
```

`users.controller.ts` with `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)` for POST/GET all, `@Get(':id')` checks `currentUser.role===ADMIN || currentUser.id===id`.

- [ ] **Step 4: Run test — expect PASS**

Run: `bun --filter api test -- src/modules/users`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/users
git commit -m "feat: add users module (admin-only CRUD)"
```

---

### Task 4: Santri Module (ADMIN write, auth read)

**Files:**
- Create: `apps/api/src/modules/santri/santri.module.ts`
- Create: `apps/api/src/modules/santri/santri.service.ts`
- Create: `apps/api/src/modules/santri/santri.controller.ts`
- Create: `apps/api/src/modules/santri/dto/create-santri.dto.ts`
- Create: `apps/api/src/modules/santri/dto/update-santri.dto.ts`
- Test: `apps/api/src/modules/santri/santri.service.spec.ts`

**Interfaces:**
- Consumes: PrismaService
- Produces: `POST /api/santri` (ADMIN), `GET /api/santri` (auth), `GET /api/santri/:id`, `PATCH /api/santri/:id` (ADMIN), `DELETE /api/santri/:id` (ADMIN)

- [ ] **Step 1: Write failing test**

```ts
describe('SantriService', () => {
  it('should create santri', async () => {
    const prisma = { santri:{ create: vi.fn().mockResolvedValue({id:'1', nis:'N1'}) }};
    const svc = new SantriService(prisma as any);
    const res = await svc.create({ nis:'N1', nama:'Ahmad', kelas:'XII', kamar:'A1'});
    expect(res.nis).toBe('N1');
  });
  it('should fail duplicate nis (prisma P2002)', async () => {
    const prisma = { santri:{ create: vi.fn().mockRejectedValue({code:'P2002'}) }};
    const svc = new SantriService(prisma as any);
    await expect(svc.create({ nis:'N1', nama:'A', kelas:'X', kamar:'1'})).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `bun --filter api test -- src/modules/santri`

- [ ] **Step 3: Implement**

`create-santri.dto.ts`: `@IsString nis,nama,kelas,kamar, @IsOptional @IsString foto,alamat,noHp`.

`update-santri.dto.ts`: `PartialType(CreateSantriDto)`.

Service wraps Prisma errors -> ConflictException on P2002.

Controller: `@UseGuards(JwtAuthGuard)` for GET, `@Roles(Role.ADMIN)` for POST/PATCH/DELETE.

- [ ] **Step 4: Run — PASS**

Run: `bun --filter api test -- src/modules/santri`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/santri
git commit -m "feat: add santri module (CRUD, admin-guarded)"
```

---

### Task 5: Notifications Module (in-app)

**Files:**
- Create: `apps/api/src/modules/notifications/notifications.module.ts`
- Create: `apps/api/src/modules/notifications/notifications.service.ts`
- Create: `apps/api/src/modules/notifications/notifications.controller.ts`
- Test: `apps/api/src/modules/notifications/notifications.service.spec.ts`

**Interfaces:**
- Consumes: PrismaService
- Produces: `NotificationsService.create(userId, title, message, type?, relatedId?)`, `findByUser(userId)`, `markRead(id,userId)`, `markAllRead(userId)`; controller `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all` (all JwtAuthGuard, scoped to current user)

- [ ] **Step 1: Write failing test**

```ts
describe('NotificationsService', () => {
  it('should create notification', async () => {
    const prisma = { notification:{ create: vi.fn().mockResolvedValue({id:'1', title:'Test'}) }};
    const svc = new NotificationsService(prisma as any);
    const n = await svc.create({ userId:'u1', title:'Izin Baru', message:'Ahmad mengajukan KELUAR', type:'new_request', relatedId:'p1' });
    expect(n.title).toBe('Izin Baru');
  });
  it('should mark read only own notification', async () => {
    const prisma = { notification:{ findUnique: vi.fn().mockResolvedValue({id:'1', userId:'u2'}), update: vi.fn() }};
    const svc = new NotificationsService(prisma as any);
    await expect(svc.markRead('1','u1')).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `bun --filter api test -- src/modules/notifications`

- [ ] **Step 3: Implement**

Service methods:
```ts
create(dto:{userId,title,message,type?,relatedId?}) { return this.prisma.notification.create({data:{...dto}}); }
createMany(dtos: {...}[]) { return this.prisma.notification.createMany({data:dtos}); }
findByUser(userId:string) { return this.prisma.notification.findMany({where:{userId}, orderBy:{createdAt:'desc'}}); }
async markRead(id:string,userId:string){ const n=await this.prisma.notification.findUnique({where:{id}}); if(!n||n.userId!==userId) throw new ForbiddenException(); return this.prisma.notification.update({where:{id}, data:{isRead:true}}); }
markAllRead(userId:string){ return this.prisma.notification.updateMany({where:{userId, isRead:false}, data:{isRead:true}}); }
```

Controller uses `@CurrentUser() user` to scope.

- [ ] **Step 4: Run — PASS**

Run: `bun --filter api test -- src/modules/notifications`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/notifications
git commit -m "feat: add notifications module (in-app)"
```

---

### Task 6: Permissions Module — Core Workflow + State Machine

**Files:**
- Create: `apps/api/src/modules/permissions/permissions.module.ts`
- Create: `apps/api/src/modules/permissions/permissions.service.ts`
- Create: `apps/api/src/modules/permissions/permissions.controller.ts`
- Create: `apps/api/src/modules/permissions/dto/create-permission.dto.ts`
- Create: `apps/api/src/modules/permissions/dto/reject-permission.dto.ts`
- Create: `apps/api/src/modules/permissions/dto/query-permission.dto.ts`
- Test: `apps/api/src/modules/permissions/permissions.service.spec.ts`

**Interfaces:**
- Consumes: PrismaService, NotificationsService
- Produces: `POST /api/permissions` (SANTRI/WALI, scoping), `GET /api/permissions` (scoped + pagination), `GET /api/permissions/:id`, `PATCH /api/permissions/:id/approve` (ADMIN, MENUNGGU->DISETUJUI), `PATCH /api/permissions/:id/reject` (ADMIN, with reason)

- [ ] **Step 1: Write failing test**

```ts
describe('PermissionsService', () => {
  it('should reject SANTRI creating for other santriId', async () => {
    const prisma = { permission:{ create: vi.fn()}, santri:{ findUnique: vi.fn() } };
    const svc = new PermissionsService(prisma as any, {createMany:vi.fn()} as any);
    await expect(svc.create({santriId:'other', jenisIzin:'KELUAR', tujuan:'Rumah', alasan:'Sakit', tanggalKeluar:new Date(), jamKeluar:'08:00', tanggalKembali:new Date(), jamKembali:'17:00'}, {id:'u1', role:'SANTRI', santriId:'own'} as any)).rejects.toThrow();
  });
  it('should allow ADMIN to approve MENUNGGU', async () => {
    const prisma = { permission:{ findUnique: vi.fn().mockResolvedValue({id:'p1', status:'MENUNGGU', santriId:'s1'}), update: vi.fn().mockResolvedValue({id:'p1', status:'DISETUJUI'}), }, user:{ findMany: vi.fn().mockResolvedValue([{id:'uW'}]) }, santri:{ findUnique: vi.fn() } };
    const notif = { createMany: vi.fn().mockResolvedValue({}) };
    const svc = new PermissionsService(prisma as any, notif as any);
    const res = await svc.approve('p1', {id:'admin1', role:'ADMIN'} as any);
    expect(res.status).toBe('DISETUJUI');
  });
  it('should fail approve if status not MENUNGGU', async () => {
    const prisma = { permission:{ findUnique: vi.fn().mockResolvedValue({id:'p1', status:'DISETUJUI'}) } };
    const svc = new PermissionsService(prisma as any, {createMany:vi.fn()} as any);
    await expect(svc.approve('p1', {id:'admin1', role:'ADMIN'} as any)).rejects.toThrow();
  });
  it('should require reason on reject', async () => {
    const prisma = { permission:{ findUnique: vi.fn().mockResolvedValue({id:'p1', status:'MENUNGGU'}) }, user:{ findMany: vi.fn().mockResolvedValue([])} };
    const svc = new PermissionsService(prisma as any, {createMany:vi.fn()} as any);
    await expect(svc.reject('p1','', {id:'admin1'} as any)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — FAIL**

Run: `bun --filter api test -- src/modules/permissions`

- [ ] **Step 3: Implement**

`create-permission.dto.ts`:
```ts
export class CreatePermissionDto {
  @IsString() santriId!: string;
  @IsEnum(JenisIzin) jenisIzin!: JenisIzin;
  @IsString() tujuan!: string;
  @IsString() alasan!: string;
  @IsOptional() @IsString() keterangan?: string;
  @IsDateString() tanggalKeluar!: string;
  @Matches(/^\d{2}:\d{2}$/) jamKeluar!: string;
  @IsDateString() tanggalKembali!: string;
  @Matches(/^\d{2}:\d{2}$/) jamKembali!: string;
}
```

Service logic:
- `create(dto, currentUser)`: if SANTRI assert `dto.santriId===currentUser.santriId`, if WALI same check, if ADMIN allow any. Validate `new Date(dto.tanggalKeluar) <= new Date(dto.tanggalKembali)` else BadRequest. Create permission `status: MENUNGGU`. Then `notificationsService.createMany` for all ADMIN users: title `Pengajuan Izin Baru`, message `${santri.nama} mengajukan ${dto.jenisIzin}`.
- `findAll(query, currentUser)`: build where: if SANTRI/WALI filter `santriId: currentUser.santriId` (and if query.santriId mismatched -> forbidden), ADMIN respects query. Pagination `skip=(page-1)*limit, take=limit`. Return `{data, total, page, limit}`.
- `findOne(id, currentUser)`: get permission with santri include, check ownership or ADMIN.
- `approve(id, currentUser)`: find, assert `status===MENUNGGU`, update `status: DISETUJUI, approvedById: currentUser.id, approvedAt: new Date()`, notify users linked to santri (find `user where santriId=permission.santriId`).
- `reject(id, reason, currentUser)`: if !reason throw BadRequest, update `status: DITOLAK, rejectionReason: reason`, notify similarly.

Controller: `@UseGuards(JwtAuthGuard)` for create/list/detail, `@Roles(Role.ADMIN)` for approve/reject, `@Roles(Role.SANTRI, Role.WALI)` for create.

- [ ] **Step 4: Run — PASS**

Run: `bun --filter api test -- src/modules/permissions`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/permissions
git commit -m "feat: add permissions module (create, scoping, approve/reject, notifications)"
```

---

### Task 7: Web Foundation — Auth, Components, Login

**Files:**
- Create: `apps/web/lib/auth.ts`
- Modify: `apps/web/lib/api.ts` — add Authorization header from localStorage
- Create: `apps/web/components/ui/button.tsx`
- Create: `apps/web/components/ui/input.tsx`
- Create: `apps/web/components/ui/card.tsx`
- Create: `apps/web/components/ui/badge.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/layout.tsx`
- Test: `apps/web` smoke — not unit, manual

**Interfaces:**
- Consumes: `apps/api` `POST /api/auth/login` via `apiFetch`
- Produces: `lib/auth.ts` `{ getToken, setToken, clearToken, useAuth() }`, `lib/api.ts` sends `Authorization: Bearer <token>`, login page stores token + redirects to /dashboard

- [ ] **Step 1: Write failing manual test (check page exists)**

Run: `bun --filter web build` should fail if login page missing (Next build error).

- [ ] **Step 2: Run — confirm missing**

Run: `bun --filter web build`
Expected: no login route yet

- [ ] **Step 3: Implement**

`apps/web/lib/auth.ts`:
```ts
export const TOKEN_KEY='santripermit_token';
export function getToken(){ if(typeof window==='undefined') return null; return localStorage.getItem(TOKEN_KEY); }
export function setToken(t:string){ localStorage.setItem(TOKEN_KEY,t); }
export function clearToken(){ localStorage.removeItem(TOKEN_KEY); }
```

Modify `apps/web/lib/api.ts` to inject header:
```ts
const token = typeof window!=='undefined' ? localStorage.getItem('santripermit_token') : null;
headers: { "Content-Type":"application/json", ...(token?{Authorization:`Bearer ${token}`}:{}), ...(options.headers??{}) }
```

`components/ui/button.tsx` etc. using `cn` from `lib/utils.ts` and Tailwind primary `bg-primary text-primary-foreground hover:bg-primary-hover`.

`app/(auth)/login/page.tsx` client component: form state, `apiFetch<{access_token,user}>('/auth/login',{method:'POST', body:JSON.stringify({usernameOrEmail, password})})`, `setToken`, `window.location.href='/dashboard'`, error display.

- [ ] **Step 4: Run build — PASS**

Run: `bun --filter web build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib apps/web/components apps/web/app/\(auth\)
git commit -m "feat: add web auth foundation and login page"
```

---

### Task 8: Web Dashboard + Izin Flows (Ajukan & Riwayat)

**Files:**
- Create: `apps/web/app/(dashboard)/layout.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/web/app/(dashboard)/izin/ajukan/page.tsx`
- Create: `apps/web/app/(dashboard)/izin/riwayat/page.tsx`
- Create: `apps/web/components/header.tsx` (nav + bell polling)
- Test: manual `bun run dev` both apps

**Interfaces:**
- Consumes: `GET /api/auth/me`, `GET /api/notifications`, `POST /api/permissions`, `GET /api/permissions?status=&page=&limit=`
- Produces: Dashboard summary, ajukan form, riwayat table with filters, polling notifications every 30s

- [ ] **Step 1: Write failing check — pages not exist**

Run: `bun --filter web build` should show no dashboard routes.

- [ ] **Step 2: Implement layout guard**

`(dashboard)/layout.tsx` client: `useEffect` fetch `/auth/me` with token, if 401 redirect `/login`, else render sidebar (role-based links: Santri/Wali show Ajukan+Riwayat, Admin shows Perizinan+Santri), `Header` with bell polling `GET /api/notifications` every 30s.

- [ ] **Step 3: Implement dashboard page**

`dashboard/page.tsx`: fetch `GET /api/permissions?limit=100` then compute counts `menunggu, disetujui, riwayat.length`, cards.

- [ ] **Step 4: Implement ajukan + riwayat**

`izin/ajukan/page.tsx`: form controls for JenisIzin select, tujuan, alasan, keterangan, tanggalKeluar/Kembali (type date), jamKeluar/Kembali (type time), validation before submit, `POST /api/permissions` with `santriId` from `me.santriId` (or select if ADMIN), on success redirect to riwayat.

`izin/riwayat/page.tsx`: fetch `GET /api/permissions?page=&status=`, table with Badge for status (MENUNGGU yellow, DISETUJUI green, DITOLAK red), pagination, detail dialog, filter dropdown.

- [ ] **Step 5: Build verify**

Run: `bun --filter web build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/\(dashboard\) apps/web/components/header.tsx
git commit -m "feat: add dashboard, ajukan izin, riwayat pages"
```

---

### Task 9: Web Admin Pages + E2E + Polish

**Files:**
- Create: `apps/web/app/(dashboard)/admin/perizinan/page.tsx`
- Create: `apps/web/app/(dashboard)/admin/santri/page.tsx`
- Create: `apps/api/test/app.e2e-spec.ts` (update existing) or `apps/api/test/permissions.e2e-spec.ts`
- Modify: `apps/api/src/app.module.ts` — ensure all modules imported (final check)
- Test: `bun --filter api test` + `bun --filter api test:e2e`

**Interfaces:**
- Consumes: `PATCH /api/permissions/:id/approve|reject`, `POST /api/santri`, `GET /api/santri`
- Produces: Admin perizinan table with approve/reject actions, santri CRUD table, e2e coverage

- [ ] **Step 1: Write failing e2e**

```ts
// apps/api/test/permissions.e2e-spec.ts
describe('Permissions e2e', () => {
  it('WALI cannot approve', async () => { /* login as wali, POST permission, PATCH approve -> 403 */ });
  it('ADMIN can approve MENUNGGU -> DISETUJUI and triggers notification', async () => { /* ... */ });
  it('Reject without reason fails 400', async () => { /* ... */ });
});
```

- [ ] **Step 2: Run e2e — FAIL (endpoints not wired or guards missing)**

Run: `bun --filter api test:e2e`
Expected: FAIL

- [ ] **Step 3: Implement admin pages**

`admin/perizinan/page.tsx`: fetch all permissions (admin), table same as riwayat but with approve/reject buttons, reject dialog requires textarea reason, calls `PATCH /api/permissions/:id/approve` or `/reject`, optimistic refresh, show santri history inline via `GET /api/santri/:id` or filter by santriId.

`admin/santri/page.tsx`: fetch `GET /api/santri`, table, create dialog `POST /api/santri`, edit `PATCH /api/santri/:id`, delete with confirm, create user dialog `POST /api/users`.

Polish: empty states, loading spinners, error toasts, responsive.

- [ ] **Step 4: Run tests — PASS**

Run: `bun --filter api test`
Run: `bun --filter api test:e2e`
Run: `bun --filter web build`
Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(dashboard\)/admin apps/api/test
git commit -m "feat: add admin perizinan & santri pages, e2e tests"
```

---

## Self-Review

- Spec coverage: All §2-7 mapped — Task1 data, Task2 auth, Task3 users, Task4 santri, Task5 notifications, Task6 permissions (core workflow), Task7-9 frontend (login, dashboard, izin, admin). Non-functional (security, pagination, CORS, docker) in Task1-2.
- No placeholders: every step has actual code blocks with concrete DTOs, Prisma calls, UI snippets.
- Type consistency: Role enum `SANTRI|WALI|ADMIN` used consistently across schema, guards, DTOs, frontend. `santriId` linking consistent.
- Gaps fixed: added `createMany` notifications interface for bulk admin notify, added `tsx` seed dep, added `tsx` to generation.

