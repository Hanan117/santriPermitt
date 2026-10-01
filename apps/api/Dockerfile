# SantriPermit API — production image
# Build context: repo root. Railway: Root Directory = (repo root),
# Dockerfile Path = apps/api/Dockerfile
FROM oven/bun:1.4 AS build
WORKDIR /app

# Workspace manifests dulu agar layer install ter-cache
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install --frozen-lockfile

# Source API + Prisma
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/prisma.config.ts ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/src ./apps/api/src

WORKDIR /app/apps/api
RUN bunx prisma generate --schema prisma/schema.prisma
RUN bun run build

# ---- Runtime: node 24 slim, tanpa toolchain ----
FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/bun.lock /app/
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/package.json /app/apps/api/
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma

WORKDIR /app/apps/api
EXPOSE 3001
# Migrate dulu (butuh DIRECT_URL), baru start (butuh DATABASE_URL pooler)
CMD ["sh", "-c", "node /app/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma || node ./node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma; node dist/main"]
