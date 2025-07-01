FROM node:20-alpine

WORKDIR /app

# Install system dependencies for libsodium and other native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libsodium-dev \
    wget

# Install dependencies first for better caching
COPY package.json ./
RUN npm install

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Remove dev dependencies for production (keep as separate layer)
RUN npm prune --production

# Set default environment variables
ENV NODE_ENV=${NODE_ENV:-development}
ENV SERVER_PORT=${SERVER_PORT:-3000}

# Expose port
EXPOSE ${SERVER_PORT:-3000}

# Health check (remove curl dependency for alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${SERVER_PORT:-3000}/api/health || exit 1

# Start the application
CMD ["node", "dist/server.js"] 