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

# Build packages needed by web
RUN pnpm --filter @wa/types run build
RUN pnpm --filter @wa/ui run build --if-present

# Build Next.js (output: standalone configured in next.config.ts)
RUN pnpm --filter @wa/web run build

# ─── Runner ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Static assets
COPY --from=builder /app/apps/web/public ./public

# Standalone server (output: standalone includes everything needed)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
