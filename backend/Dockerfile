# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Imagen de producción
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Exponer puerto gRPC
EXPOSE 50051

# Comando para iniciar el servidor gRPC
CMD ["node", "dist/main.js"]
