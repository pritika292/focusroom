# syntax=docker/dockerfile:1.7

# --- Build stage ------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY build ./build
COPY src ./src
COPY public ./public
COPY migrations ./migrations
COPY scripts ./scripts
RUN npm run build

RUN npm prune --omit=dev

# --- Runtime stage ----------------------------------------------------------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

USER node
EXPOSE 3016

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3016/health >/dev/null || exit 1

# Run migrations on every boot (the runner is idempotent), then start the
# server. `tsx` is a runtime dep so scripts/abuse-review.ts and migrations
# (the compiled JS variant) both work.
CMD ["sh", "-c", "node --enable-source-maps dist/server/db/migrate.js && node --enable-source-maps dist/server/index.js"]
