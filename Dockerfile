# ==================== Stage 1: Build ====================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Install ts-patch for typia/nestia transforms
RUN yarn prepare

# Generate Prisma client (dummy URL for build, actual URL provided at runtime)
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate

# Build and bundle with ncc
RUN yarn build:ncc

# ==================== Stage 2: Production ====================
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy bundled application only
COPY --from=builder /app/bundle ./bundle

# Set ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "bundle/index.js"]
