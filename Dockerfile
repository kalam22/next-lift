FROM node:20-slim AS base
WORKDIR /app

# ========== DEPENDENCIES ==========
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ========== BUILDER ==========
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://kalam:kalam@db:5432/cursor?schema=public
RUN npx prisma generate
RUN npm run build

# ========== RUNNER ==========
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends postgresql-client && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output (includes server.js + compiled app + node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Copy static chunks separately
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy Prisma client binary for runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
# Copy Prisma schema for migrations
COPY --from=builder /app/prisma ./prisma

# Copy seed script (JS version, no tsx needed)
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

# Copy Prisma CLI + client for db push at runtime
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy bcryptjs for seed
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy entrypoint
COPY --chmod=755 entrypoint.sh /entrypoint.sh

USER root
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
