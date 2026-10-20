# ==============================================================================
# SecureRAG AI Backend - Production Dockerfile
# ==============================================================================
FROM node:22-alpine AS base

# Install security updates and utilities
RUN apk --no-cache add ca-certificates wget

WORKDIR /app

# Set production environment
ENV NODE_ENV=production \
    PORT=5000

# Install production dependencies with proper ownership
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy application source with proper ownership
COPY --chown=node:node src/ ./src/

# Switch to non-root user for security
USER node

# Expose internal API listener port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Direct execution of server process for clean SIGTERM/SIGINT propagation
CMD ["node", "src/server.js"]
