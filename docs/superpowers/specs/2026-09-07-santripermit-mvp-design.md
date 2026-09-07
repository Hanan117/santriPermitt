# SantriPermit MVP — Design Spec

**Date:** 2026-09-07  
**Status:** Approved (brainstorming)  
**Scope:** MVP only (PRD §7) — Login multi-role, Pengajuan izin, Approve/Reject, Notifikasi in-app ke admin, Riwayat. Fase 2 (WA, laporan & ekspor, manajemen lengkap) & Fase 3 (QR) out-of-scope.  
**Repo:** `santriPermitt` — Turborepo + Bun, apps/web (Next.js 16), apps/api (NestJS 12)

---

## 1. Context & Goals

**Problem (PRD §1.1):** Perizinan santri masih manual (buku kertas BIS), antrean, risiko hilang/palsu, tanpa notifikasi wali.  
**Goals (PRD §1.2):** Efisiensi, transparansi real-time, akuntabilitas (timestamp permanen), komunikasi, keamanan anti-pemalsuan (fase lanjut).  
**Users (PRD §2):** Santri, Admin/Musyrif, Wali Santri.  
**Decisions from brainstorming:**
- MVP scope only (user confirmed 2026-09-07: setuju)
- Auth: JWT+bcrypt, roles `SANTRI / WALI / ADMIN` (ADMIN = Musyrif/Pengurus) — option A confirmed
- DB: PostgreSQL (keep existing `apps/api/prisma/schema.prisma:9`), not MySQL — confirmed
- Registration: Admin creates accounts; Santri & Wali both can submit permissions — confirmed
- Notifications MVP: in-app only (table `Notification`), WA/SMS Fase 2 — confirmed
- Architecture lean MVP (Approach 1) — confirmed

---

## 2. Architecture

### 2.1 Stack
| Layer | Tech | Notes |
|-------|------|-------|
| Monorepo | Turborepo 2 + Bun 1.4 | `workspaces: apps/*, packages/*` |
| Frontend | Next.js 16 App Router + Tailwind 4 | SSR/SSG, responsive |
| Backend | NestJS 12 + Prisma 6 + PostgreSQL 16 | `apps/api/prisma/schema.prisma:1` |
| Auth | @nestjs/jwt + bcrypt + Passport-JWT | JWT 7d, hash rounds 10 |
| Containers | Docker Compose | postgres + api + web |

### 2.2 Monorepo Structure (MVP)
```
santripermit/
├── apps/web/
│   ├── app/(auth)/login/page.tsx
│   ├── app/(dashboard)/layout.tsx
│   ├── app/(dashboard)/dashboard/page.tsx
│   ├── app/(dashboard)/izin/ajukan/page.tsx
│   ├── app/(dashboard)/izin/riwayat/page.tsx
│   ├── app/(dashboard)/admin/perizinan/page.tsx
│   ├── app/(dashboard)/admin/santri/page.tsx
│   ├── components/ui/ (button, input, card, badge, table, dialog)
│   ├── lib/api.ts          # existing apiFetch
│   └── lib/utils.ts        # cn()
├── apps/api/
│   ├── prisma/schema.prisma
│   ├── src/prisma/ (PrismaModule, PrismaService)
│   ├── src/modules/auth/
│   ├── src/modules/users/
│   ├── src/modules/santri/
│   ├── src/modules/permissions/
│   ├── src/modules/notifications/
│   └── src/common/ (guards, decorators, filters)
├── packages/ui, eslint-config, typescript-config
├── docker-compose.yml
└── turbo.json
```
`packages/database|auth|types` deferred post-MVP.

---

## 3. Data Model

### 3.1 Enums
```prisma
enum Role { SANTRI WALI ADMIN }
enum JenisIzin { KELUAR PULANG }
enum StatusIzin { MENUNGGU DISETUJUI DITOLAK SEDANG_KELUAR SUDAH_KEMBALI }
```

### 3.2 Models (delta vs current `apps/api/prisma/schema.prisma:13`)
- **User:** `id cuid, email @unique, username @unique, password (hashed), role Role @default(SANTRI), santriId String? @unique (nullable, for SANTRI & WALI linking), santri Santri? @relation, createdAt, updatedAt`
- **Santri:** `id cuid, userId String? @unique (optional, for primary santri account), user User? @relation, nis @unique, nama, kelas, kamar, foto?, alamat?, noHp?, createdAt, updatedAt, @@index([nama]), @@index([kelas])` — remove `waliNama/waliHp`; wali linked via `User.santriId`. If >1 wali per santri needed later, add join table `SantriWali`.
- **Permission:** unchanged fields `jenisIzin, tujuan, alasan @db.Text, keterangan? @db.Text, tanggalKeluar @db.Date, jamKeluar String, tanggalKembali @db.Date, jamKembali String, status @default(MENUNGGU), rejectionReason? @db.Text, approvedById?, approvedAt?, checkedOutAt?, checkedInAt?, santriId, santri Santri @relation, createdAt, updatedAt, @@index([santriId, status, jenisIzin, createdAt])`
- **Notification:** `id cuid, userId, title, message @db.Text, isRead @default(false), type String?, relatedId String?, createdAt, @@index([userId, isRead])`

### 3.3 Migration
`prisma migrate dev --name init-mvp`, seed: `admin / admin123` (ADMIN), sample santri/wali.

---

## 4. API Design

### 4.1 Auth
- `POST /api/auth/login` Body `{ usernameOrEmail, password }` → `{ access_token, user: {id, username, email, role, santriId} }` — bcrypt compare, JwtService sign `{sub, role}`.
- `POST /api/auth/logout` (client clears token, optional blacklist later)
- `GET /api/auth/me` (JwtAuthGuard) → current user
- Guards: `JwtAuthGuard` (extends AuthGuard('jwt')), `RolesGuard` via `@Roles(...roles)` + `@CurrentUser()` decorator.

### 4.2 Users (ADMIN only)
- `POST /api/users` Body `{ email, username, password, role, santriId? }` — hash password, validate santriId exists for SANTRI/WALI.
- `GET /api/users` (ADMIN)
- `GET /api/users/:id` (ADMIN or self)

### 4.3 Santri (ADMIN write, auth read)
- `POST /api/santri` Body `{ nis, nama, kelas, kamar, foto?, alamat?, noHp? }`
- `GET /api/santri` + `GET /api/santri/:id` (auth)
- `PATCH /api/santri/:id`, `DELETE /api/santri/:id` (ADMIN)

### 4.4 Permissions (Izin) — Core Workflow PRD §4
- `POST /api/permissions` Roles SANTRI,WALI Body `{ santriId, jenisIzin, tujuan, alasan, keterangan?, tanggalKeluar, jamKeluar, tanggalKembali, jamKembali }` — validation: santriId owned (SANTRI own, WALI linked), tanggalKeluar <= tanggalKembali, jam `HH:mm` regex. Triggers `Notification` to all ADMIN.
- `GET /api/permissions?status=&jenisIzin=&santriId=&page=&limit=` — scoped: SANTRI/WALI filter to owned/linked, ADMIN all. Pagination limit 20 default.
- `GET /api/permissions/:id` — ownership or ADMIN.
- `PATCH /api/permissions/:id/approve` ADMIN — guard status==MENUNGGU, set status DISETUJUI, approvedById, approvedAt, notify SANTRI+WALI.
- `PATCH /api/permissions/:id/reject` ADMIN Body `{ reason }` — set DITOLAK + rejectionReason, notify.
- `PATCH /api/permissions/:id/checkout|checkin` (optional MVP) — transition DISETUJUI→SEDANG_KELUAR→SUDAH_KEMBALI.

### 4.5 Notifications
- `GET /api/notifications` (own userId)
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

### 4.6 Cross-cutting
- `ValidationPipe { whitelist:true, forbidNonWhitelisted:true, transform:true }` already in `apps/api/src/main.ts:13`
- Global `HttpException` filter, Prisma error mapping.
- CORS `WEB_URL` env.

---

## 5. Frontend

### 5.1 Routes (App Router)
- `(auth)/login` — form, calls `POST /api/auth/login`, stores JWT (MVP: localStorage + Authorization header via `lib/api.ts`; upgrade to httpOnly cookie post-MVP), redirect by role.
- `(dashboard)/layout.tsx` — auth guard (`GET /api/auth/me`), sidebar/header role-based, bell icon polling `GET /api/notifications` every 30s, unread count.
- `(dashboard)/dashboard` — summary cards (menunggu, disetujui, riwayat count).
- `(dashboard)/izin/ajukan` — form (jenisIzin select, tujuan, alasan textarea, keterangan, tanggalKeluar/Kembali date inputs, jamKeluar/Kembali time), submit `POST /api/permissions`.
- `(dashboard)/izin/riwayat` — table + status badge filter, detail dialog, pagination.
- `(dashboard)/admin/perizinan` — ADMIN: all permissions table + approve/reject dialogs (reject requires reason), review santri history inline.
- `(dashboard)/admin/santri` — ADMIN: CRUD santri, create user dialog.

### 5.2 Components
`components/ui/button, input, card, badge, table, dialog` — Tailwind using `cn()` from `apps/web/lib/utils.ts:1`, palette `--color-primary #059669` existing in `apps/web/app/globals.css:15`.

### 5.3 Data Fetching
MVP: native fetch via `apps/web/lib/api.ts:3 apiFetch`, `useState/useEffect`. No React Query yet.

---

## 6. Non-Functional

| Aspect | Requirement |
|--------|-------------|
| Security | bcrypt 10, JWT 7d, RBAC guards, ValidationPipe, CORS |
| Performance | <3s response, pagination 20, no N+1 (Prisma include) |
| Compatibility | Responsive Tailwind, tested desktop/tablet/mobile |
| Integrity | `createdAt/updatedAt`, `approvedById/approvedAt`, `checkedOutAt/checkedInAt` audit trail |
| Infra | `docker-compose.yml` (postgres:16, api:3001, web:3000), `.env.example` for both apps |

---

## 7. Testing

- **Unit (Vitest):** `auth.service.spec` (hash, login success/fail), `permissions.service.spec` (create scoping, approve state-machine, reject reason required), `notifications.service.spec` (create triggers).
- **E2E (vitest e2e):** `POST /api/auth/login`, `POST /api/permissions` (as SANTRI/WALI/ADMIN), `PATCH /api/permissions/:id/approve` RBAC (WALI forbidden, ADMIN success), `GET /api/notifications` after events.
- **Web smoke:** `bun run dev` both apps, login flows for 3 roles, submit → approve → notification visible.

---

## 8. Out-of-Scope (Fase 2/3)

WA/SMS gateway, QR Code verification, laporan & ekspor PDF/Excel, PWA offline, Better Auth, `packages/database|auth|types` extraction, rate-limit advanced, Remote Caching.

---

## 9. Implementation Order (for plan)

1. Prisma schema migration + seed + docker-compose
2. Auth module (JWT, guards, decorators)
3. Users + Santri modules
4. Permissions module + state-machine
5. Notifications module + triggers
6. Web auth + dashboard + izin flows
7. Admin pages + polish + tests

---

## 10. Self-Review

- [x] No TBD/TODO placeholders
- [x] Internal consistency: role WALI matches PRD user WALI, DB Postgres consistent with existing files, notifications in-app aligns with MVP matrix
- [x] Scope focused: MVP only, single plan
- [x] Ambiguities resolved via brainstorming Q&A (all 5 questions confirmed)
