# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy everything
COPY . .

# Install all deps (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Build packages in dependency order
RUN pnpm --filter @wa/types run build
RUN pnpm --filter @wa/bird-client run build
RUN pnpm --filter @wa/flow-engine run build
# Generate Prisma client for linux-musl-openssl-3.0.x (Alpine)
RUN pnpm --filter @wa/database run generate
RUN pnpm --filter @wa/database run build

# Build API
RUN pnpm --filter @wa/api run build

# Create clean production deployment (resolves workspace symlinks into real files)
RUN pnpm --filter @wa/api deploy --prod /prod/api

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma needs openssl
RUN apk add --no-cache openssl

# App compiled output
COPY --from=builder /app/apps/api/dist ./dist

# node_modules with all workspace deps resolved
COPY --from=builder /prod/api/node_modules ./node_modules

# Prisma schema + migrations
COPY --from=builder /app/packages/database/prisma ./prisma

# Generate Prisma client for this OS (linux-musl-openssl-3.0.x)
RUN node node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

# Copy entrypoint script
COPY --from=builder /app/apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Upload directory
RUN mkdir -p /app/uploads

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
