# syntax=docker/dockerfile:1

# --- Base deps/build stage ---
FROM node:22-alpine AS builder
WORKDIR /app

# Enable corepack (bundled with Node 22) to use pnpm
RUN corepack enable

# Install dependencies first (better layer caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build
COPY . .
RUN pnpm build

# --- Runtime stage ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Enable corepack so pnpm is available (for optional CLI like schema:sync)
RUN corepack enable

# Copy node_modules including dev deps (kept for CLI usage like typeorm-ts-node-commonjs)
COPY --from=builder /app/node_modules ./node_modules
# Copy production artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
# Keep uploads directory for static serving (mounted as volume in compose)
RUN mkdir -p /app/uploads

EXPOSE 3000

# Default command starts the compiled Nest app
CMD ["node", "dist/src/main.js"]
