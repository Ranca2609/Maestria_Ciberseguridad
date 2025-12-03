# QuetzalShip - Sistema de Envíos

Microservicio de gestión de órdenes de envío desarrollado con NestJS + TypeScript y gRPC.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Docker](#docker)
- [Pruebas](#pruebas)
- [API gRPC](#api-grpc)
- [Frontend](#frontend)
- [Principios SOLID](#principios-solid)
- [Representación de Dinero](#representación-de-dinero)
- [Tags](#tags)

## Descripción

QuetzalShip es un microservicio que permite:
- Crear órdenes de envío con múltiples paquetes
- Calcular tarifas basadas en zona, servicio, peso y dimensiones
- Aplicar descuentos y seguros
- Consultar, listar y cancelar órdenes
- Generar recibos con desglose de cálculos

## Arquitectura

```
├── backend/                 # Servidor NestJS + gRPC
│   ├── src/
│   │   ├── order/          # Módulo de órdenes
│   │   │   ├── calculators/  # Calculadores (SOLID)
│   │   │   ├── validators/   # Validadores
│   │   │   ├── repositories/ # Repositorio en memoria
│   │   │   ├── services/     # Servicios de negocio
│   │   │   └── controllers/  # Controlador gRPC
│   │   ├── gateway/        # Gateway REST para frontend
│   │   └── shared/         # Interfaces y enums
│   ├── proto/              # Archivos .proto
│   └── test/               # Pruebas unitarias
├── frontend/               # Aplicación React
│   └── src/
│       ├── components/     # Componentes React
│       ├── services/       # API client
│       └── styles/         # CSS
└── docs/postman/           # Colección Postman gRPC
```

## Requisitos

- Node.js >= 18
- npm >= 9
- Docker y Docker Compose (opcional)

## Instalación

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Ejecución

### Modo Desarrollo (Local)

**Terminal 1 - Servidor gRPC:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Gateway REST:**
```bash
cd backend
npm run start:gateway
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

Acceder a:
- gRPC: `localhost:50051`
- Gateway REST: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### Modo Producción (Local)

```bash
cd backend
npm run build
npm run start:prod &
npm run start:gateway:prod &

cd ../frontend
npm run build
npm run preview
```

## Docker

### Levantar todo con Docker Compose

```bash
# Construir y levantar todos los servicios
docker-compose up --build

# O en segundo plano
docker-compose up -d --build
```

### Servicios disponibles:

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| grpc-server | 50051 | Servidor gRPC principal |
| gateway | 3001 | API REST (proxy a gRPC) |
| frontend | 80 | Aplicación web React |

### Comandos Docker útiles:

```bash
# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Reconstruir un servicio específico
docker-compose build grpc-server

# Desarrollo con hot-reload
docker-compose -f docker-compose.dev.yml up
```

## Pruebas

### Ejecutar pruebas unitarias

```bash
cd backend
npm test
```

### Ejecutar con cobertura

```bash
npm run test:cov
```

### Casos de prueba incluidos:

- **Cálculos:**
  - Peso volumétrico por paquete
  - Peso tarifable por paquete
  - Acumulación multi-paquete
  - Tarifa base por zona destino
  - Multiplicador por servicio
  - Recargo frágil por paquete
  - Recargo por seguro
  - Descuento PERCENT con límite 35
  - Descuento FIXED con truncamiento a 0.00
  - Redondeo final a 2 decimales

- **Validaciones:**
  - Peso o dimensiones <= 0
  - insuranceEnabled=true con suma declarada = 0
  - Descuento PERCENT > 35
  - orderId inexistente
  - Doble cancelación

## API gRPC

### Operaciones disponibles:

| RPC | Descripción |
|-----|-------------|
| CreateOrder | Crear nueva orden de envío |
| ListOrders | Listar órdenes con paginación |
| GetOrder | Obtener detalle de una orden |
| CancelOrder | Cancelar una orden activa |
| GetReceipt | Generar recibo de una orden |

### Archivo Proto

Ubicación: `backend/proto/quetzalship.proto`

### Colección Postman

Ubicación: `docs/postman/QuetzalShip.postman_collection.json`

Incluye 2 casos válidos y 1 caso inválido por cada operación.

## Frontend

### Características:

- **Diseño minimalista** con CSS puro
- **Intuitivo**: navegación por pestañas
- **Funcionalidades:**
  - Lista de órdenes con paginación
  - Crear nueva orden con múltiples paquetes
  - Ver detalle de orden con desglose
  - Cancelar órdenes activas
  - Generar y visualizar recibos

## Principios SOLID

### SRP (Single Responsibility Principle)
- Cada calculador tiene una responsabilidad única:
  - `PackageCalculator`: cálculos de paquete
  - `RateCalculator`: tarifas por zona/servicio
  - `SurchargeCalculator`: recargos
  - `DiscountCalculator`: descuentos
  - `TariffCalculator`: orquestación

### OCP (Open/Closed Principle)
- Agregar nuevo tipo de servicio o recargo se hace agregando clases, no modificando las existentes.

### ISP (Interface Segregation Principle)
- Interfaces pequeñas y específicas:
  - `IOrderRepository`
  - `IPackageCalculator`
  - `IRateCalculator`
  - `IReceiptGenerator`

### DIP (Dependency Inversion Principle)
- Servicios dependen de interfaces (tokens), no implementaciones concretas.
- Inyección de dependencias via NestJS DI.

## Representación de Dinero

Para evitar problemas de punto flotante, **todo el dinero se representa en centavos** (enteros):

- `declaredValueCents`: valor declarado en centavos
- `totalCents`: total en centavos
- `ratePerKgCents`: tarifa por kg en centavos

**Ejemplo:**
- Q 125.50 = 12550 centavos
- Q 8.00/kg = 800 centavos/kg

El redondeo final a 2 decimales se garantiza al dividir centavos entre 100.

## Tags

- **P1-LEGACY**: Versión funcional mínima
- **P1-REFACTOR**: Versión final con SOLID y tests

## Supuestos

1. El servicio no requiere autenticación/autorización.
2. La persistencia es en memoria (se pierde al reiniciar).
3. Los IDs de orden son UUID v4 generados por el servidor.
4. El pageSize máximo para ListOrders es 100.
5. El descuento FIXED puede truncar el total a 0 si excede el subtotal.

## Ejecución en Google Cloud

```bash
# Clonar repositorio
git clone <url-repositorio>
cd <nombre-repositorio>

# Opción 1: Docker Compose
docker-compose up -d --build

# Opción 2: Ejecutar manualmente
cd backend && npm install && npm run build && npm run start:prod &
cd backend && npm run start:gateway:prod &
cd frontend && npm install && npm run build && npm run preview
```

## Licencia

MIT
