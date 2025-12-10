# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built application and proto files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV ORDERS_SERVICE_URL=orders:50052
ENV RECEIPT_SERVICE_URL=receipt:50054
ENV CORS_ORIGIN=http://localhost:4200

# Expose HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/main.js"]
