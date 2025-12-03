# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente y proto
COPY src ./src
COPY proto ./proto

# Compilar TypeScript
RUN npm run build

# Imagen de producción
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar archivos compilados y proto
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Exponer puerto gRPC
EXPOSE 50051

# Comando para iniciar el servidor gRPC
CMD ["node", "dist/main.js"]
