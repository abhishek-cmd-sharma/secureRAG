# ==============================================================================
# SecureRAG Frontend - Multi-Stage Production Dockerfile
# ==============================================================================

# Stage 1: Build the Vite production bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Set build argument for API base URL (defaults to /api for reverse proxy)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy frontend source files
COPY index.html ./
COPY vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# Compile production bundle
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:1.27-alpine AS runner

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom reverse proxy and SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
