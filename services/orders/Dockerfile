# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/orders/package*.json ./

# Install dependencies
RUN npm install

# Copy source code and proto files
COPY services/orders/ .
COPY contracts/proto ./proto

# Clean any existing dist and build fresh
RUN rm -rf dist && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY services/orders/package*.json ./
RUN npm install --only=production

# Copy built application and proto files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Set environment variables
ENV NODE_ENV=production
ENV GRPC_PORT=50052
ENV PRICING_SERVICE_URL=pricing:50051

# Expose gRPC port
EXPOSE 50052

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const grpc = require('@grpc/grpc-js'); const client = new grpc.Client('localhost:50052', grpc.credentials.createInsecure()); client.waitForReady(Date.now() + 5000, (err) => process.exit(err ? 1 : 0));" || exit 1

# Start the application
CMD ["node", "dist/main.js"]
