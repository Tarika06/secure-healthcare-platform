# Backend Dockerfile - SecureCare
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy application source
COPY . .

# Expose backend port
EXPOSE 5000

# Health check - verify the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the server
CMD ["npm", "start"]
