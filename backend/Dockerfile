FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY server/package*.json ./server/

RUN npm ci --omit=dev --prefix server

COPY server ./server

EXPOSE 8080

CMD ["node", "server/index.js"]