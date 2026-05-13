FROM node:22-bookworm-slim

WORKDIR /app

COPY backend/package*.json ./backend/
COPY backend/server/package*.json ./backend/server/
COPY backend/prisma ./backend/prisma

RUN npm ci --prefix backend \
  && npm ci --omit=dev --prefix backend/server \
  && npm --prefix backend run prisma:generate

COPY backend ./backend

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "backend/server/index.js"]