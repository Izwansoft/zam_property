# =============================================================================
# Zam-Property Web Frontend — Multi-stage Dockerfile
# =============================================================================
# Uses Next.js standalone output for minimal image size.
# Build:   docker build -t zam-property-web .
# Run:     docker run -p 3001:3001 --env-file .env.local zam-property-web
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Install dependencies
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lock + package files for layer caching
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod=false

# ---------------------------------------------------------------------------
# Stage 2 — Build the application
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (NEXT_PUBLIC_*) are baked into the bundle.
# Pass them as build args or via .env.production.
ARG NEXT_PUBLIC_APP_ENV=production
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_PORTAL_NAME=Zam-Property

ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_PORTAL_NAME=$NEXT_PUBLIC_PORTAL_NAME
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 3 — Production image (standalone)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

# Start the Next.js server
CMD ["node", "server.js"]
