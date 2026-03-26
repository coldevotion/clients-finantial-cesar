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
RUN pnpm --filter @wa/worker run build

# Production deployment (resolves workspace symlinks)
RUN pnpm --filter @wa/worker deploy --prod /prod/worker

# Copy Prisma client binary from pnpm virtual store to production deployment
RUN PRISMA_PATH=$(find /app/node_modules/.pnpm -path "*/.prisma/client" -type d 2>/dev/null | head -1) && \
    if [ -n "$PRISMA_PATH" ]; then \
        mkdir -p /prod/worker/node_modules/.prisma && \
        cp -r "$PRISMA_PATH" /prod/worker/node_modules/.prisma/client; \
    fi

# ─── Runner ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

# Compiled Worker
COPY --from=builder /app/apps/worker/dist ./dist

# Production node_modules (workspace symlinks resolved + Prisma binary)
COPY --from=builder /prod/worker/node_modules ./node_modules

EXPOSE 3002

CMD ["node", "dist/main"]
