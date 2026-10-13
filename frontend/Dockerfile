# Stage 1: Base image
FROM node:20-alpine AS base

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 3: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 4: Production Runner (Lightweight standalone image ~120MB)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built standalone files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# Run production standalone Node.js server
CMD ["node", "server.js"]
