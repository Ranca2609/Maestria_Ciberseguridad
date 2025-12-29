# QuetzalShip v2.0 - Sistema de Envíos

Sistema de gestión de envíos basado en microservicios con arquitectura Gateway, desarrollado con NestJS + TypeScript, gRPC y React.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Servicios](#servicios)
- [Observabilidad](#observabilidad)
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

### Diagrama de Alto Nivel

```
                                    ┌──────────────────────────────────────────────────────────┐
                                    │                      INTERNET                             │
                                    └────────────────────────┬─────────────────────────────────┘
                                                             │
                                                             ▼
                                    ┌────────────────────────────────────────┐
                                    │         INGRESS / LOAD BALANCER        │
                                    │         (nginx / traefik)              │
                                    └────────────────────┬───────────────────┘
                                                         │
                                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CAPA DE APLICACIÓN                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  ┌─────────────────┐              ┌──────────────────────────────────────┐                    │
│  │   Frontend      │──── HTTP ───▶│        API Gateway                   │                    │
│  │ (Vite + React)  │              │        (NestJS)                      │                    │
│  │    :4200        │              │         :3000                        │                    │
│  └─────────────────┘              │  • REST API                          │                    │
│                                    │  • Swagger /api                      │                    │
│                                    │  • Health Check /health              │                    │
│                                    │  • Correlation ID Injection          │                    │
│                                    │  • Retry + Timeout Logic             │                    │
│                                    └──────────┬───────────────────────────┘                    │
│                                               │                                                 │
│                                               │ gRPC                                            │
│                      ┌────────────────────────┼────────────────────────┐                       │
│                      │                        │                        │                       │
│                      ▼                        ▼                        ▼                       │
│           ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐               │
│           │  Pricing Service │    │  Orders Service  │    │ Receipt Service  │               │
│           │    (NestJS)      │    │    (NestJS)      │    │    (NestJS)      │               │
│           │     :50051       │◀───│     :50052       │───▶│     :50054       │               │
│           │                  │    │                  │    │                  │               │
│           │ • Tarifas        │    │ • CRUD Órdenes   │    │ • Generación     │               │
│           │ • Peso Vol.      │    │ • Estados        │    │   de Recibos     │               │
│           │ • Descuentos     │    │ • Idempotencia   │    │ • Desglose       │               │
│           └──────────────────┘    └────────┬─────────┘    └──────────────────┘               │
│                                             │                                                   │
│                                             │                                                   │
│                                             ▼                                                   │
│                                    ┌──────────────────┐                                        │
│                                    │   FX Service     │                                        │
│                                    │   (NestJS)       │                                        │
│                                    │    :50055        │                                        │
│                                    │                  │                                        │
│                                    │ • Conversión GTQ │                                        │
│                                    │ • Circuit Breaker│                                        │
│                                    │ • Retry Logic    │                                        │
│                                    └────────┬─────────┘                                        │
│                                             │                                                   │
└─────────────────────────────────────────────┼───────────────────────────────────────────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CAPA DE DATOS Y CACHE                                          │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│     ┌──────────────────┐              ┌──────────────────┐                                    │
│     │   MSSQL Server   │              │      Redis       │                                    │
│     │     :1433        │              │      :6379       │                                    │
│     │                  │              │                  │                                    │
│     │ • Orders DB      │              │ • FX Cache       │                                    │
│     │ • Persistence    │              │ • TTL 5 min      │                                    │
│     │ • Transactions   │              │ • Idempotency    │                                    │
│     └──────────────────┘              └──────────────────┘                                    │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE OBSERVABILIDAD (ELK + GRAFANA)                              │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│                           ┌─── FLUJO DE LOGS ───┐                                             │
│                           │                      │                                             │
│  ┌─────────────────┐      │     ┌──────────────────────┐                                      │
│  │  Microservicios │──────┼────▶│     Logstash         │                                      │
│  │  (GELF Driver)  │      │     │      :12201/udp      │                                      │
│  │                 │      │     │                      │                                      │
│  │ • Gateway       │      │     │ • Recibe logs GELF   │                                      │
│  │ • Pricing       │      │     │ • Parsea JSON        │                                      │
│  │ • Orders        │      │     │ • Enriquece metadata │                                      │
│  │ • Receipt       │      │     └──────────┬───────────┘                                      │
│  │ • FX            │      │                │                                                   │
│  └─────────────────┘      │                ▼                                                   │
│                           │     ┌──────────────────────┐                                      │
│                           │     │   Elasticsearch      │                                      │
│                           │     │       :9200          │                                      │
│                           │     │                      │                                      │
│                           │     │ • Almacena logs      │                                      │
│                           │     │ • Índices por fecha  │                                      │
│                           │     │ • Búsqueda full-text │                                      │
│                           │     └──────────┬───────────┘                                      │
│                           │                │                                                   │
│                           │       ┌────────┴────────┐                                         │
│                           │       │                 │                                         │
│                           │       ▼                 ▼                                         │
│                           │  ┌──────────┐    ┌──────────────┐                                │
│                           │  │  Kibana  │    │   Grafana    │                                │
│                           │  │  :5601   │    │    :3001     │                                │
│                           │  │          │    │              │                                │
│                           │  │ • Explore│    │ • Dashboards │                                │
│                           │  │ • Discover    │ • Alertas    │                                │
│                           │  │ • Visualize   │ • Métricas   │                                │
│                           │  └──────────┘    │ • Correlation│                                │
│                           │                  │   ID Filter  │                                │
│                           └──────────────────┴──────────────┘                                │
│                                                                                                 │
│  Credenciales Grafana: admin / quetzalship                                                     │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CAPA DE TESTING                                                 │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│     ┌──────────────────────────────────────────────────────────────┐                          │
│     │                    Locust                                     │                          │
│     │                   :8089 (UI)                                  │                          │
│     │                                                                │                          │
│     │  • Pruebas de Carga (Load Testing)                            │                          │
│     │  • Simulación de usuarios concurrentes                        │                          │
│     │  • Métricas: RPS, latencia, errores                           │                          │
│     │  • Tipos: quick, normal, stress, spike, soak                  │                          │
│     │                                                                │                          │
│     │  Targets: Gateway :3000 → Microservicios                      │                          │
│     └────────────────────────┬───────────────────────────────────────┘                          │
│                              │                                                                  │
│                              └──────▶ Genera logs observables en ELK/Grafana                   │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FLUJOS PRINCIPALES                                            │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                 │
│  1. FLUJO DE REQUEST:                                                                          │
│     Internet → Ingress → Gateway → Microservicio → MSSQL/Redis → Response                     │
│                                                                                                 │
│  2. FLUJO DE LOGS:                                                                             │
│     Microservicio (GELF) → Logstash :12201 → Elasticsearch :9200 → Kibana :5601               │
│                                                                                                 │
│  3. FLUJO DE MONITOREO:                                                                        │
│     Elasticsearch :9200 → Grafana :3001 (Dashboards + Correlation ID Filter)                  │
│                                                                                                 │
│  4. FLUJO DE TESTING:                                                                          │
│     Locust :8089 → Gateway :3000 → Microservicios → Logs en ELK/Grafana                       │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Componentes Clave

#### Entrada Pública

- **Internet**: Punto de entrada externo
- **Ingress/Load Balancer**: Nginx o Traefik para balanceo de carga y SSL termination
- **API Gateway** (:3000): Punto único de entrada REST, maneja autenticación, rate limiting, y enrutamiento

#### Microservicios (Comunicación Interna gRPC)

- **Pricing Service** (:50051): Cálculo de tarifas y descuentos
- **Orders Service** (:50052): Gestión de órdenes y persistencia
- **Receipt Service** (:50054): Generación de recibos
- **FX Service** (:50055): Conversión de moneda con circuit breaker

#### Dependencias de Datos

- **MSSQL Server** (:1433): Base de datos relacional para órdenes
- **Redis** (:6379): Cache para tasas de cambio e idempotencia

#### Stack de Observabilidad (ELK)

- **Logstash** (:12201/udp): Recepción y procesamiento de logs vía GELF
- **Elasticsearch** (:9200): Almacenamiento e indexación de logs
- **Kibana** (:5601): Exploración y visualización de logs
- **Grafana** (:3001): Dashboards, métricas y filtrado por Correlation ID

#### Testing

- **Locust** (:8089): Pruebas de carga y estrés con UI web

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

### FX Service (gRPC - :50055) 🆕

- **Conversión de moneda** (GTQ ↔ USD, EUR, GBP, MXN)
- **Dos APIs externas**: ExchangeRate-API (primaria) + FreeCurrency (fallback)
- **Caché con Redis**: TTL configurable (default 5 min)
- **Resiliencia avanzada**:
  - Circuit Breaker independiente por proveedor
  - Retries con backoff exponencial (1s → 2s → 4s)
  - Timeouts configurables (default 3s)
- **Degradación elegante**: Caché → API Primary → API Fallback → Tasas Default
- **Endpoints**: `convert`, `getExchangeRate`, `getRates`

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

## Observabilidad

QuetzalShip incluye un **stack completo de observabilidad** basado en ELK + Grafana:

### Stack de Monitoreo

| Componente        | Puerto    | Credenciales        | Descripción                |
| ----------------- | --------- | ------------------- | -------------------------- |
| **Grafana**       | 3001      | admin / quetzalship | Dashboards y visualización |
| **Kibana**        | 5601      | -                   | Exploración de logs        |
| **Elasticsearch** | 9200      | -                   | Almacenamiento de logs     |
| **Logstash**      | 12201/udp | -                   | Procesamiento de logs      |

### Features de Observabilidad

✅ **Correlation ID:** Rastreo end-to-end de requests  
✅ **Logs Estructurados:** Formato JSON para análisis  
✅ **Dashboards:** Visualización en tiempo real  
✅ **Filtros Avanzados:** Por servicio, nivel, correlationId  
✅ **Alertas:** Monitoreo de errores (configurable)

### Inicio Rápido - Observabilidad

```bash
# 1. Levantar el stack completo
docker compose -f docker-compose.local.yml up -d

# 2. Acceder a Grafana
# URL: http://localhost:3001
# Usuario: admin
# Contraseña: quetzalship

# 3. Ir al dashboard "QuetzalShip - Logs Avanzados"

# 4. Generar logs de prueba
./scripts/generate-test-logs.sh
# o en Windows:
.\scripts\generate-test-logs.ps1
```

### Dashboards Disponibles

**Dashboard Principal:** "QuetzalShip - Logs Avanzados"

- 📊 **Errores Totales:** Contador en tiempo real
- 📈 **Logs por Nivel:** Gráfico temporal (info/warn/error)
- 🔥 **Errores por Servicio:** Distribución de errores
- 🥧 **Distribución:** Porcentaje por servicio
- 📝 **Logs Recientes:** Vista detallada con búsqueda

### Filtros de Dashboard

En el dashboard "QuetzalShip - Logs Avanzados", ahora puedes **filtrar logs por Correlation ID**:

#### Cómo Filtrar Logs

1. **Obtén un Correlation ID:**

   ```powershell
   # Ejecuta este script para hacer un request
   .\scripts\get-correlation-id.ps1
   # El Correlation ID se copia automáticamente al portapapeles
   ```

2. **Ve a Grafana:** http://localhost:3001

3. **Pega el Correlation ID** en el campo de texto en la parte superior del dashboard

4. **Ver resultados:** El panel "Logs Recientes (Filtrados)" mostrará **solo los logs de ese request**

#### Ejemplos de Filtros

| Query                                                  | Resultado                     |
| ------------------------------------------------------ | ----------------------------- |
| `correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e"` | Todos los logs de ese request |
| `correlationId:"31f9fbe5..." AND logLevel:error`       | Solo errores de ese request   |
| `correlationId:"31f9fbe5..." AND serviceName:gateway`  | Solo logs del Gateway         |
| _(campo vacío)_                                        | Todos los logs (sin filtro)   |

📖 **Guía completa de filtrado:** [docs/GRAFANA_FILTER_GUIDE.md](docs/GRAFANA_FILTER_GUIDE.md)

### Rastreo de Requests

Cada request al Gateway recibe un `X-Correlation-ID`:

```bash
# Request
curl -v http://localhost:3000/api/v1/orders/...

# Response incluye:
# X-Correlation-ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Para rastrear el request completo:

1. Copiar el Correlation ID del header
2. Ir a Grafana → Dashboard
3. Pegar el ID en el filtro "Correlation ID"
4. Ver todos los logs relacionados

### Documentación Completa

#### Observabilidad

📚 **Guía de observabilidad completa:** [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)  
🎯 **Cómo filtrar logs en Grafana:** [docs/GRAFANA_FILTER_GUIDE.md](docs/GRAFANA_FILTER_GUIDE.md)  
🔍 **Cómo obtener Correlation ID:** [docs/CORRELATION_ID_GUIDE.md](docs/CORRELATION_ID_GUIDE.md)  
📊 **Resumen técnico:** [docs/OBSERVABILITY_SUMMARY.md](docs/OBSERVABILITY_SUMMARY.md)

#### Servicio FX (Conversión de Moneda)

🔍 **Guía de validación FX (Backend):** [docs/FX_SERVICE_VALIDATION.md](docs/FX_SERVICE_VALIDATION.md)  
🎨 **Validación desde Frontend:** [docs/FX_FRONTEND_VALIDATION.md](docs/FX_FRONTEND_VALIDATION.md)

**Pruebas rápidas:**

```powershell
# Validar características del backend (CLI)
.\scripts\validate-fx-service.ps1

# Probar resiliencia (circuit breaker, retries, degradación)
.\scripts\test-fx-resilience.ps1

# Validar desde la UI
# 1. Levantar servicios: docker-compose -f docker-compose.dev.yml up -d
# 2. Ir a: http://localhost:4200/currency
# 3. Probar conversiones, caché, circuit breaker desde la interfaz
```

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

| Servicio          | URL                          |
| ----------------- | ---------------------------- |
| Frontend          | http://localhost:4200        |
| Gateway (Swagger) | http://localhost:3000/api    |
| Health Check      | http://localhost:3000/health |

## Docker

### Levantar con Docker Compose

```bash
# Construir y levantar todos los servicios
docker compose up --build

# O en segundo plano
docker compose up -d --build
```

### Servicios Docker

| Contenedor           | Puerto | Descripción                |
| -------------------- | ------ | -------------------------- |
| quetzalship-pricing  | 50051  | Servicio de precios (gRPC) |
| quetzalship-orders   | 50052  | Servicio de órdenes (gRPC) |
| quetzalship-receipt  | 50054  | Servicio de recibos (gRPC) |
| quetzalship-gateway  | 3000   | API Gateway (REST)         |
| quetzalship-frontend | 4200   | Frontend (nginx)           |

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
4. **Build & Push Docker**: Construcción y publicación de imágenes
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

## Docker Images

### Container Registry

Las imágenes se publican en **GitHub Container Registry (ghcr.io)**.

### Repositorios de Imágenes

| Servicio | Repositorio                            |
| -------- | -------------------------------------- |
| Pricing  | `ghcr.io/<owner>/quetzalship-pricing`  |
| Orders   | `ghcr.io/<owner>/quetzalship-orders`   |
| Receipt  | `ghcr.io/<owner>/quetzalship-receipt`  |
| Gateway  | `ghcr.io/<owner>/quetzalship-gateway`  |
| Frontend | `ghcr.io/<owner>/quetzalship-frontend` |

### Reglas de Tagging

| Evento               | Formato del Tag              | Ejemplo           |
| -------------------- | ---------------------------- | ----------------- |
| Push a `main`        | `main-<SHORT_SHA>`           | `main-f25f63d`    |
| Push a `main`        | `main-latest`                | `main-latest`     |
| Push a `release/<X>` | `<X>`                        | `v2.0.0`          |
| Pull Request         | `pr-<PR_NUMBER>-<SHORT_SHA>` | `pr-42-a1b2c3d`   |
| Otras ramas          | `<branch>-<SHORT_SHA>`       | `develop-f25f63d` |

### Ejemplos de Tags

```bash
# Push a main (commit f25f63d)
ghcr.io/ranca2609/quetzalship-pricing:main-f25f63d
ghcr.io/ranca2609/quetzalship-pricing:main-latest
ghcr.io/ranca2609/quetzalship-gateway:main-f25f63d
ghcr.io/ranca2609/quetzalship-gateway:main-latest

# Push a release/v2.0.0
ghcr.io/ranca2609/quetzalship-pricing:v2.0.0
ghcr.io/ranca2609/quetzalship-gateway:v2.0.0
ghcr.io/ranca2609/quetzalship-frontend:v2.0.0

# Pull Request #42 (commit a1b2c3d)
ghcr.io/ranca2609/quetzalship-pricing:pr-42-a1b2c3d
ghcr.io/ranca2609/quetzalship-gateway:pr-42-a1b2c3d
```

### Uso de Imágenes

```bash
# Descargar imagen de release
docker pull ghcr.io/ranca2609/quetzalship-gateway:v2.0.0

# Descargar última versión de main
docker pull ghcr.io/ranca2609/quetzalship-gateway:main-latest

# Ejecutar contenedor
docker run -p 3000:3000 ghcr.io/ranca2609/quetzalship-gateway:v2.0.0
```

## API REST

### Endpoints

| Método | Endpoint                   | Descripción    |
| ------ | -------------------------- | -------------- |
| POST   | /api/v1/orders             | Crear orden    |
| GET    | /api/v1/orders             | Listar órdenes |
| GET    | /api/v1/orders/:id         | Obtener orden  |
| PATCH  | /api/v1/orders/:id/cancel  | Cancelar orden |
| GET    | /api/v1/orders/:id/receipt | Obtener recibo |
| GET    | /health                    | Health check   |

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

### Pruebas Unitarias

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

### Pruebas de Carga con Locust 🚀

El proyecto incluye pruebas de carga automatizadas con [Locust](https://locust.io/):

```bash
# Instalación
cd tests/load
pip install -r requirements.txt

# Ejecución con UI
locust -f locustfile.py --host http://localhost:3000
# Abrir navegador en: http://localhost:8089

# Ejecución rápida (headless)
./run-locust.ps1 -TestType quick -GenerateReport        # Windows
./run-locust.sh -t quick -g                              # Linux/Mac
```

**Tipos de pruebas disponibles:**

- `quick`: 50 usuarios, 1 minuto (validación)
- `normal`: 100 usuarios, 10 minutos (carga normal)
- `stress`: 300 usuarios, 5 minutos (estrés)
- `spike`: 500 usuarios, 2 minutos (picos)
- `soak`: 50 usuarios, 2 horas (resistencia)

**Documentación completa:** [docs/LOCUST_LOAD_TESTING.md](docs/LOCUST_LOAD_TESTING.md)

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

| Tag              | Descripción                    |
| ---------------- | ------------------------------ |
| P1-LEGACY        | Versión original (monolito)    |
| P1-REFACTOR      | Versión con SOLID              |
| P2-MICROSERVICES | Arquitectura de microservicios |

## Zonas y Tarifas

| Zona     | Tarifa Base (Q/kg) |
| -------- | ------------------ |
| METRO    | Q8.00              |
| INTERIOR | Q12.00             |
| FRONTERA | Q16.00             |

| Servicio | Multiplicador |
| -------- | ------------- |
| STANDARD | 1.0×          |
| EXPRESS  | 1.35×         |
| SAME_DAY | 1.8×          |

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
