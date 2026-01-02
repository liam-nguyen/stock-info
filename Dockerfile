FROM node:20-alpine

WORKDIR /app

# Set Docker environment variable for detection
ENV DOCKER_CONTAINER=true

# Install Chromium dependencies for Alpine Linux
# @sparticuz/chromium needs these system libraries to run
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Copy package files
COPY package*.json ./

# Install all dependencies including @sparticuz/chromium (needed for build and runtime)
# Using npm ci to ensure exact versions from lock file
RUN npm ci

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies but keep @sparticuz/chromium (it's in optionalDependencies, so it stays)
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]

