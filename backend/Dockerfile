# syntax=docker/dockerfile:1.7

# --- Base deps layer ---
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install

# --- Builder for production ---
FROM base AS build
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Production runtime ---
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]

# --- Development target (hot reload) ---
FROM base AS dev
WORKDIR /app
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
EXPOSE 3001
CMD ["npm", "run", "start:dev"]
