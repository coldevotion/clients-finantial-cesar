# ─── Base ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# ─── Builder ────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy everything
COPY . .

# Install all deps
RUN pnpm install --frozen-lockfile

# Build packages in dependency order
RUN pnpm --filter @wa/types run build
RUN pnpm --filter @wa/bird-client run build
RUN pnpm --filter @wa/flow-engine run build
RUN pnpm --filter @wa/database run generate
RUN pnpm --filter @wa/database run build

# Build API
RUN pnpm --filter @wa/api run build

# Create clean production deployment (resolves workspace symlinks into real files)
RUN pnpm --filter @wa/api deploy --prod /prod/api

# ─── Runner ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# App compiled output
COPY --from=builder /app/apps/api/dist ./dist

# node_modules with all workspace deps resolved (no symlinks)
COPY --from=builder /prod/api/node_modules ./node_modules

# Prisma schema (needed for migrations and query engine)
COPY --from=builder /app/packages/database/prisma ./prisma

# Prisma query engine binary
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@*/node_modules/@prisma/client/libquery_engine* ./node_modules/@prisma/client/ 2>/dev/null || true

EXPOSE 3001
CMD ["node", "dist/main"]
