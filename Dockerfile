FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY backend/server/package*.json ./backend/server/
COPY frontend/package*.json ./frontend/

RUN npm ci --omit=dev --prefix backend/server \
  && npm ci --prefix frontend

COPY backend/server ./backend/server
COPY frontend ./frontend

RUN npm --prefix frontend run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/backend/server ./backend/server
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

CMD ["node", "backend/server/index.js"]