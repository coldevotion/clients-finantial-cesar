# ─── Base ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9 --activate

# ─── Builder ────────────────────────────────────────────────────────────────
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

# Build Worker
RUN pnpm --filter @wa/worker run build

# Create clean production deployment
RUN pnpm --filter @wa/worker deploy --prod /prod/worker

# ─── Runner ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /prod/worker/node_modules ./node_modules
COPY --from=builder /app/packages/database/prisma ./prisma

EXPOSE 3002
CMD ["node", "dist/main"]
