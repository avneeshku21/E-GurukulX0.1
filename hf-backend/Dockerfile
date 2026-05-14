FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=7860

COPY server/package*.json ./server/

RUN npm ci --omit=dev --prefix server

COPY server ./server

EXPOSE 7860

CMD ["node", "server/index.js"]