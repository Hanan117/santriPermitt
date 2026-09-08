# Task 5 Report — Notifications Module (in-app)

- Service: `apps/api/src/modules/notifications/notifications.service.ts` — `create(dto)`, `createMany(dtos)`, `findByUser(userId)` ordered `createdAt desc`, `markRead(id,userId)` with ForbiddenException if not owned, `markAllRead(userId)` via `updateMany`
- Controller: `apps/api/src/modules/notifications/notifications.controller.ts` — `@UseGuards(JwtAuthGuard)` scoped via `@CurrentUser() user`; `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read` (read-all before :id to avoid route conflict)
- Module: `apps/api/src/modules/notifications/notifications.module.ts` exports `NotificationsService`
- Tests: `apps/api/src/modules/notifications/notifications.service.spec.ts` — 4/4 passed (create with mockImplementation echo, markRead forbidden, findByUser order check, markAllRead); full `bun --filter api test` 13/13 passed (6 files)
- Commit: 5e1f405 feat: add notifications module (in-app)
- Note: Brief's failing test mock `{id:'1', title:'Test'}` would always fail vs `expect(title='Izin Baru')`; fixed mock to `mockImplementation(({data})=> {title:data.title})` to preserve intent while passing

## Fix 2026-09-08 — Wire NotificationsModule into AppModule
- Fix: `apps/api/src/app.module.ts:9` added `import { NotificationsModule } from './modules/notifications/notifications.module.js'`; `apps/api/src/app.module.ts:21` added `NotificationsModule` to `imports` array alongside `PrismaModule, AuthModule, UsersModule, SantriModule`
- Verification: `bun --filter api test -- src/modules/notifications` — 4/4 passed (1 file)
