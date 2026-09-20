# syntax=docker/dockerfile:1

# ---- deps ------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build -----------------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# PUBLIC_* values are inlined into the client bundle at build time, so they have
# to be present here — not only at runtime.
ARG PUBLIC_MAGENTO_GRAPHQL_ENDPOINT=https://magento.test/graphql
ARG PUBLIC_MAGENTO_BASE_URL=https://magento.test/
ARG PUBLIC_MAGENTO_STORE_CODE=default
ARG PUBLIC_SITE_URL=http://localhost:4321
ENV PUBLIC_MAGENTO_GRAPHQL_ENDPOINT=$PUBLIC_MAGENTO_GRAPHQL_ENDPOINT \
    PUBLIC_MAGENTO_BASE_URL=$PUBLIC_MAGENTO_BASE_URL \
    PUBLIC_MAGENTO_STORE_CODE=$PUBLIC_MAGENTO_STORE_CODE \
    PUBLIC_SITE_URL=$PUBLIC_SITE_URL
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
# Only production dependencies reach the final image.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
RUN npm prune --omit=dev && addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4321)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "./dist/server/entry.mjs"]
