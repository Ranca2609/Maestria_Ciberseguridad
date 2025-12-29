# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/fx/package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy proto files
COPY contracts/proto/*.proto ./proto/

# Copy source code
COPY services/fx/tsconfig.json ./
COPY services/fx/nest-cli.json ./
COPY services/fx/src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and install production only
COPY services/fx/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Environment variables
ENV NODE_ENV=production
ENV GRPC_PORT=50055

EXPOSE 50055

CMD ["node", "dist/main"]
