# --- Stage 1: build the Angular application ---
FROM node:22-alpine AS build
WORKDIR /app
ENV CI=true

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:1.27-alpine AS runtime

# Backend upstream for the /api reverse proxy (overridable at runtime).
ENV API_UPSTREAM=https://mini-shop-api-production-d245.up.railway.app

COPY nginx/docker-entrypoint-resolver.sh /usr/local/bin/start-resolver.sh
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/mini-shop-ng/browser /usr/share/nginx/html
RUN chmod +x /usr/local/bin/start-resolver.sh

# Fixed port, used everywhere: nginx listen, healthcheck, Docker Compose,
# Angular dev server and Railway's default PORT (8080).
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:8080/" >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/start-resolver.sh"]
