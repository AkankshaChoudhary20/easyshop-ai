# Lean 3-stage build using Next's standalone output.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy values so `next build` (which touches env-dependent modules at build
# time, e.g. reading process.env.ANTHROPIC_API_KEY in src/lib/ai/client.ts)
# doesn't fail — real values are injected at runtime by docker-compose.
ENV DATABASE_URL="postgres://placeholder:placeholder@localhost:5432/placeholder"
ENV JWT_SECRET="placeholder-build-time-secret"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", "server.js"]
