# ─── Base ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile

# Build packages in dependency order
RUN pnpm --filter @wa/types run build
RUN pnpm --filter @wa/bird-client run build
RUN pnpm --filter @wa/flow-engine run build
RUN pnpm --filter @wa/database run generate
RUN pnpm --filter @wa/database run build
RUN pnpm --filter @wa/api run build

# Production deployment (resolves workspace symlinks)
RUN pnpm --filter @wa/api deploy --prod /prod/api

# Copy Prisma client binary from pnpm virtual store to production deployment
RUN PRISMA_PATH=$(find /app/node_modules/.pnpm -path "*/.prisma/client" -type d 2>/dev/null | head -1) && \
    if [ -n "$PRISMA_PATH" ]; then \
        mkdir -p /prod/api/node_modules/.prisma && \
        cp -r "$PRISMA_PATH" /prod/api/node_modules/.prisma/client; \
    fi

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Compiled API
COPY --from=builder /app/apps/api/dist ./dist

# Production node_modules (workspace symlinks resolved + Prisma binary)
COPY --from=builder /prod/api/node_modules ./node_modules

# Prisma schema + migrations (for migrate deploy at startup)
COPY --from=builder /app/packages/database/prisma ./prisma

# Fix: pnpm deploy corrupts @prisma/client by stripping runtime/ files
# Install fresh @prisma/client and restore runtime to the pnpm virtual store
RUN npm install @prisma/client@5.22.0 --ignore-scripts --no-package-lock --quiet 2>/dev/null; \
    for dir in $(find /app/node_modules/.pnpm -path "*/@prisma/client" -type d 2>/dev/null); do \
        cp -rf /app/node_modules/@prisma/client/runtime "$dir/"; \
        STORE_NM=$(dirname "$(dirname "$dir")"); \
        mkdir -p "$STORE_NM/.prisma"; \
        cp -rf /app/node_modules/.prisma "$STORE_NM/"; \
    done; \
    rm -f package.json package-lock.json

# Entrypoint (runs migrations + seed + starts server)
COPY --from=builder /app/apps/api/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

RUN mkdir -p /app/uploads

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
