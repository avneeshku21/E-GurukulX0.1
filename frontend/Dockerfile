FROM node:22-bookworm-slim AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/40-auto-reload-certs.sh /docker-entrypoint.d/40-auto-reload-certs.sh
RUN chmod +x /docker-entrypoint.d/40-auto-reload-certs.sh
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]