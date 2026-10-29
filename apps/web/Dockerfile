# Tommy's Bus web — Next.js standalone server
FROM docker.io/library/node:24-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Cache the pnpm store across builds; generous timeouts for slow networks.
RUN --mount=type=cache,id=tommysbus-pnpm,target=/pnpm-store \
    pnpm install --frozen-lockfile --store-dir=/pnpm-store \
      --fetch-timeout=300000 --fetch-retries=6 --network-concurrency=8

FROM deps AS build
COPY . .
# Rewrites to Django are resolved at build time.
ARG API_INTERNAL_URL=http://api:8000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV API_INTERNAL_URL=$API_INTERNAL_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM docker.io/library/node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
