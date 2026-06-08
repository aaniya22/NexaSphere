# Stage 1: Install production dependencies
FROM node:20-alpine AS deps

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory with correct permissions before switching user
RUN mkdir -p /app && chown -R node:node /app

# Switch to non-root user
USER node
WORKDIR /app

# Copy package configuration with correct ownership
COPY --chown=node:node package*.json ./

# Install dependencies (only production)
RUN npm ci --omit=dev --prefer-offline

# Stage 2: Production runtime image
FROM node:20-alpine AS production

ENV NODE_ENV=production

# Copy dumb-init from deps stage
COPY --from=deps /usr/bin/dumb-init /usr/bin/dumb-init

# Create app directory and set ownership to node user
RUN mkdir -p /app && chown -R node:node /app

# Switch to non-root user
USER node
WORKDIR /app

# Copy production node_modules from deps stage
COPY --chown=node:node --from=deps /app/node_modules ./node_modules

# Copy application source explicitly with node user ownership
COPY --chown=node:node . .

# Port is read from the PORT env variable at runtime (defaults to 8787).
EXPOSE 8787

# Health check — lets Docker know the container is ready
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-8787}/health || exit 1

# Use dumb-init as entrypoint to properly handle signals (SIGINT, SIGTERM)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
