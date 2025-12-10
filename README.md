# QuetzalShip v2.0 - Sistema de Envíos

Sistema de gestión de envíos basado en microservicios con arquitectura Gateway, desarrollado con NestJS + TypeScript, gRPC y React.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Servicios](#servicios)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Docker](#docker)
- [CI/CD](#cicd)
- [API REST](#api-rest)
- [Pruebas](#pruebas)
- [Idempotencia](#idempotencia)
- [Principios SOLID](#principios-solid)
- [Tags](#tags)

## Descripción

QuetzalShip v2.0 es un sistema de microservicios que permite:
- Crear órdenes de envío con múltiples paquetes
- Calcular tarifas basadas en zona (METRO, INTERIOR, FRONTERA), servicio (STANDARD, EXPRESS, SAME_DAY), peso y dimensiones
- Aplicar descuentos porcentuales (máx 35%) o fijos
- Aplicar seguros sobre valor declarado (2.5%)
- Consultar, listar y cancelar órdenes
- Generar recibos con desglose completo de cálculos

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Gateway     │
│  (Vite + React) │     │   (REST API)    │
│    :4200        │     │     :3000       │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │  Pricing  │ │  Orders   │ │  Receipt  │
            │  Service  │ │  Service  │ │  Service  │
            │  (gRPC)   │ │  (gRPC)   │ │  (gRPC)   │
            │  :50051   │ │  :50052   │ │  :50054   │
            └───────────┘ └─────┬─────┘ └───────────┘
                                │
                                ▼
                        ┌───────────┐
                        │  Pricing  │
                        │  Service  │
                        └───────────┘
```

### Estructura de Directorios

```
├── contracts/
│   ├── openapi/              # Especificación OpenAPI 3.0
│   │   └── quetzalship-gateway.yaml
│   └── proto/                # Archivos Protocol Buffers
│       ├── pricing.proto
│       ├── orders.proto
│       └── receipt.proto
├── services/
│   ├── pricing/              # Microservicio de cálculo de precios
│   ├── orders/               # Microservicio de gestión de órdenes
│   ├── receipt/              # Microservicio de generación de recibos
│   ├── gateway/              # API Gateway REST
│   └── frontend/             # Aplicación web Vite + React
├── .github/
│   └── workflows/
│       └── ci.yml            # Pipeline CI/CD
└── docker-compose.yml
```

## Servicios

### Pricing Service (gRPC - :50051)
- Calcula precios basados en zonas, servicios y paquetes
- Implementa peso volumétrico (L×W×H/5000)
- Aplica recargos por fragilidad (Q7/paquete)
- Aplica seguros (2.5% del valor declarado)
- Descuentos porcentuales (máx 35%) o fijos

### Orders Service (gRPC - :50052)
- Gestión completa de órdenes (CRUD)
- Estados: ACTIVE, CANCELLED
- Persistencia en memoria
- Soporte de idempotencia
- Integración con Pricing Service

### Receipt Service (gRPC - :50054)
- Generación de recibos formateados
- Desglose completo de cálculos
- Formato texto para impresión

### Gateway (REST - :3000)
- API REST documentada con Swagger
- Traducción REST ↔ gRPC
- Health checks
- Resiliencia (timeout + retry)
- Validación de entrada

### Frontend (HTTP - :4200)
- SPA con Vite + React + TypeScript
- Interfaz minimalista
- Creación de órdenes
- Lista con paginación
- Detalle y recibos

## Requisitos

- Node.js >= 20
- npm >= 9
- Docker y Docker Compose

## Instalación

### Todos los servicios

```bash
# Instalar dependencias de todos los servicios
for service in pricing orders receipt gateway frontend; do
  cd services/$service && npm install && cd ../..
done
```

### Servicio individual

```bash
cd services/<servicio>
npm install
```

## Ejecución

### Modo Desarrollo (Local)

```bash
# Terminal 1 - Pricing Service
cd services/pricing && npm run start:dev

# Terminal 2 - Orders Service
cd services/orders && npm run start:dev

# Terminal 3 - Receipt Service
cd services/receipt && npm run start:dev

# Terminal 4 - Gateway
cd services/gateway && npm run start:dev

# Terminal 5 - Frontend
cd services/frontend && npm run dev
```

### Acceso
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| Gateway (Swagger) | http://localhost:3000/api |
| Health Check | http://localhost:3000/health |

## Docker

### Levantar con Docker Compose

```bash
# Construir y levantar todos los servicios
docker compose up --build

# O en segundo plano
docker compose up -d --build
```

### Servicios Docker

| Contenedor | Puerto | Descripción |
|------------|--------|-------------|
| quetzalship-pricing | 50051 | Servicio de precios (gRPC) |
| quetzalship-orders | 50052 | Servicio de órdenes (gRPC) |
| quetzalship-receipt | 50054 | Servicio de recibos (gRPC) |
| quetzalship-gateway | 3000 | API Gateway (REST) |
| quetzalship-frontend | 4200 | Frontend (nginx) |

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f gateway

# Detener todos los servicios
docker compose down

# Detener y eliminar volúmenes
docker compose down -v
```

## CI/CD

Pipeline de GitHub Actions (`.github/workflows/ci.yml`):

1. **Lint & Type Check**: ESLint y TypeScript para todos los servicios
2. **Unit Tests**: Jest con cobertura
3. **Build Frontend**: Compilación de Vite
4. **Build Docker**: Construcción de imágenes
5. **Integration Tests**: Pruebas E2E con Docker Compose

### Ejecutar localmente

```bash
# Lint
cd services/<servicio> && npm run lint

# Tests
cd services/<servicio> && npm test

# Build
cd services/<servicio> && npm run build
```

## API REST

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/v1/orders | Crear orden |
| GET | /api/v1/orders | Listar órdenes |
| GET | /api/v1/orders/:id | Obtener orden |
| PATCH | /api/v1/orders/:id/cancel | Cancelar orden |
| GET | /api/v1/orders/:id/receipt | Obtener recibo |
| GET | /health | Health check |

### Documentación Swagger

Acceder a: http://localhost:3000/api

### Ejemplo: Crear Orden

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "clientName": "Juan Pérez",
    "originZone": "METRO",
    "destinationZone": "INTERIOR",
    "serviceType": "EXPRESS",
    "packages": [{
      "weightKg": 5,
      "heightCm": 30,
      "widthCm": 20,
      "lengthCm": 15,
      "fragile": true,
      "declaredValueQ": 500
    }],
    "insuranceEnabled": true
  }'
```

## Pruebas

### Ejecutar tests unitarios

```bash
# Pricing Service
cd services/pricing && npm test

# Con cobertura
npm run test:cov
```

### Casos de prueba incluidos

- Cálculo METRO + STANDARD
- Multiplicador EXPRESS (1.35×)
- Multiplicador SAME_DAY (1.8×)
- Recargo frágil (Q7/paquete)
- Seguro (2.5% valor declarado)
- Descuento porcentual
- Límite descuento 35%
- Descuento fijo
- Truncamiento a Q0.00
- Validación peso <= 0
- Validación dimensiones <= 0
- Peso volumétrico > peso real

## Idempotencia

El sistema soporta operaciones idempotentes mediante el header `Idempotency-Key`:

```bash
# Primera llamada - crea la orden
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Idempotency-Key: order-abc-123" \
  -d '{...}'

# Segunda llamada con misma key - retorna resultado cacheado
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Idempotency-Key: order-abc-123" \
  -d '{...}'
```

- TTL de cache: 24 horas
- Hash SHA256 del payload para validación
- Almacenamiento en memoria

## Principios SOLID

### SRP (Single Responsibility)
Cada calculador tiene una responsabilidad única:
- `PackageCalculator`: peso volumétrico y tarifable
- `RateCalculator`: tarifas por zona
- `ServiceCalculator`: multiplicadores de servicio
- `SurchargeCalculator`: recargos
- `DiscountCalculator`: descuentos

### OCP (Open/Closed)
Agregar nuevas zonas, servicios o descuentos sin modificar código existente.

### DIP (Dependency Inversion)
Servicios dependen de interfaces, inyección vía NestJS DI.

## Tags

| Tag | Descripción |
|-----|-------------|
| P1-LEGACY | Versión original (monolito) |
| P1-REFACTOR | Versión con SOLID |
| P2-MICROSERVICES | Arquitectura de microservicios |

## Zonas y Tarifas

| Zona | Tarifa Base (Q/kg) |
|------|-------------------|
| METRO | Q8.00 |
| INTERIOR | Q12.00 |
| FRONTERA | Q16.00 |

| Servicio | Multiplicador |
|----------|--------------|
| STANDARD | 1.0× |
| EXPRESS | 1.35× |
| SAME_DAY | 1.8× |

## Recargos

- **Frágil**: Q7.00 por paquete marcado como frágil
- **Seguro**: 2.5% del valor declarado total (solo si insuranceEnabled=true)

## Supuestos

1. El servicio no requiere autenticación/autorización.
2. La persistencia es en memoria (se pierde al reiniciar).
3. Los IDs de orden son UUID v4 generados por el servidor.
4. El pageSize máximo para ListOrders es 100.
5. El descuento FIXED puede truncar el total a Q0.00.
6. El timeout gRPC es de 2 segundos con 2 reintentos.

## Licencia

MIT
