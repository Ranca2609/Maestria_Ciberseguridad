# Changelog - QuetzalShip v2.0

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.1.0] - 2025-12-26

### Agregado - Stack de Observabilidad Completo

#### Infraestructura
- ✨ Stack ELK completo (Elasticsearch + Logstash + Kibana)
- ✨ Grafana para dashboards y visualización
- ✨ Logstash pipeline configurado para GELF
- ✨ Elasticsearch con índices diarios automáticos

#### Middleware y Logging
- ✨ Middleware `CorrelationIdMiddleware` para generar/propagar correlation IDs
- ✨ Middleware `LoggerMiddleware` para logging estructurado HTTP
- ✨ Logger estructurado compartido (`services/shared/logger.ts`)
- ✨ Logs en formato JSON compatible con ELK

#### Dashboards y Visualización
- ✨ Dashboard Grafana "QuetzalShip - Logs Avanzados" con:
  - Panel de errores totales
  - Gráfico de logs por nivel en el tiempo
  - Conteo de errores por servicio
  - Distribución de logs por servicio (pie chart)
  - Panel de logs recientes con búsqueda
- ✨ Variables de dashboard:
  - Filtro multi-select por servicio
  - Filtro multi-select por nivel (info/warn/error)
  - Campo de búsqueda por correlation ID

#### Pipeline de Datos
- 🔧 Logstash pipeline mejorado con extracción de:
  - `correlationId` (rastreo end-to-end)
  - `serviceName` (identificación de microservicio)
  - `logLevel` (normalizado a lowercase)
  - `httpMethod`, `httpUrl`, `httpStatus` (métricas HTTP)
  - `duration` (rendimiento)
- 🔧 Normalización automática de log levels
- 🔧 Índices dinámicos con patrón `quetzalship-logs-YYYY.MM.DD`

#### Documentación
- 📚 Guía completa de observabilidad (`docs/OBSERVABILITY.md`)
- 📚 Resumen técnico de implementación (`docs/OBSERVABILITY_SUMMARY.md`)
- 📚 Sección de observabilidad en README principal
- 📚 Ejemplos de queries útiles para Elasticsearch

#### Scripts y Herramientas
- 🛠️ Script Bash de generación de logs de prueba (`scripts/generate-test-logs.sh`)
- 🛠️ Script PowerShell de generación de logs de prueba (`scripts/generate-test-logs.ps1`)
- 🛠️ Escenarios de prueba: success, error, warn, not found
- 🛠️ Generación de carga para testing

#### Docker Compose Local
- 🐳 `docker-compose.local.yml` con stack completo:
  - MSSQL Server 2022
  - Redis 7
  - Elasticsearch 8.11
  - Logstash 8.11
  - Kibana 8.11
  - Grafana 10.2
  - Todos los microservicios con logging GELF
  - Locust para load testing

### Mejorado

#### Gateway
- 🔧 Gateway ahora genera y propaga `X-Correlation-ID` automáticamente
- 🔧 Logs estructurados en formato JSON
- 🔧 Logging de requests/responses con metadata completa
- 🔧 Middleware aplicado a todas las rutas

#### Logstash
- 🔧 Mejor manejo de JSON parsing con fallback
- 🔧 Extracción de campos HTTP para análisis
- 🔧 Template de índices optimizado
- 🔧 Skip de JSON inválido sin romper el pipeline

#### Grafana
- 🔧 Datasource Elasticsearch con UID estable
- 🔧 Auto-provisioning de datasources
- 🔧 Auto-provisioning de dashboards
- 🔧 Refresh automático cada 5 segundos

### Archivos Nuevos

```
services/
├── gateway/src/middleware/
│   ├── correlation-id.middleware.ts    ← NUEVO
│   ├── logger.middleware.ts            ← NUEVO
│   └── index.ts                        ← NUEVO
└── shared/
    └── logger.ts                       ← NUEVO

docker/
└── grafana/provisioning/dashboards/
    └── quetzalship-advanced-logs.json  ← NUEVO

docs/
├── OBSERVABILITY.md                    ← NUEVO
└── OBSERVABILITY_SUMMARY.md            ← NUEVO

scripts/
├── generate-test-logs.sh               ← NUEVO
└── generate-test-logs.ps1              ← NUEVO
```

### Archivos Modificados

```
docker/
├── grafana/provisioning/datasources/
│   └── datasources.yaml                ← Actualizado (UID agregado)
└── logstash/pipeline/
    └── logstash.conf                   ← Actualizado (más campos)

services/gateway/src/
└── gateway.module.ts                   ← Actualizado (middleware)

README.md                               ← Actualizado (sección observabilidad)
```

### Características de Observabilidad

#### Rastreo End-to-End
- Correlation ID único (UUID v4) por request
- Propagación automática en headers
- Rastreo completo desde Gateway hasta microservicios

#### Métricas Disponibles
- ✅ Tasa de errores (total y por servicio)
- ✅ Distribución de logs por nivel
- ✅ Tendencias temporales de errores
- ✅ Duración de requests (performance)
- ✅ Status codes HTTP
- ✅ Logs detallados con búsqueda

#### Filtrado Avanzado
- Por servicio (gateway, orders, pricing, receipt, fx)
- Por nivel (info, warn, error, debug)
- Por correlation ID (búsqueda exacta)
- Por rango de tiempo (últimos 15m, 1h, 24h, custom)

### Notas de Migración

#### Para Desarrolladores

1. **Usar Logger Estructurado:**
   ```typescript
   import { createLogger } from '../shared/logger';
   
   const logger = createLogger('mi-servicio');
   logger.info('Mensaje', { metadata: 'valor' });
   ```

2. **Acceder a Correlation ID:**
   ```typescript
   // En controladores/servicios del Gateway
   const correlationId = (req as any).correlationId;
   ```

3. **Verificar Logs:**
   ```bash
   docker logs quetzalship-gateway
   # Debe mostrar JSON estructurado
   ```

#### Para DevOps

1. **Levantar Stack Completo:**
   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```

2. **Verificar Elasticsearch:**
   ```bash
   curl http://localhost:9200/_cat/indices?v
   # Debe mostrar: quetzalship-logs-YYYY.MM.DD
   ```

3. **Acceder a Grafana:**
   - URL: http://localhost:3001
   - Usuario: admin
   - Contraseña: quetzalship

### Métricas de Impacto

- **Archivos nuevos:** 9
- **Archivos modificados:** 4
- **Líneas de código agregadas:** ~2,500
- **Documentación:** ~1,000 líneas
- **Paneles de Grafana:** 5
- **Filtros de dashboard:** 3
- **Campos indexados en ES:** 10+

### Referencias

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Logstash GELF Plugin](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-gelf.html)
- [Correlation ID Pattern](https://www.rapid7.com/blog/post/2016/12/23/the-value-of-correlation-ids/)

---

## [2.0.0] - 2025-12-20

### Agregado
- Arquitectura de microservicios con gRPC
- Gateway REST API
- Pricing Service
- Orders Service
- Receipt Service
- FX Service para conversión de divisas
- Frontend Vite + React
- Docker Compose para orquestación
- CI/CD con GitHub Actions
- Swagger/OpenAPI documentation

### Mejorado
- Separación de responsabilidades
- Escalabilidad horizontal
- Resiliencia (timeout + retry)
- Idempotencia en Orders Service

---

## [1.0.0] - 2025-12-15

### Agregado (P1-REFACTOR)
- Principios SOLID aplicados
- Dependency Injection con NestJS
- Unit tests con Jest
- Calculadores separados por responsabilidad
- Validadores específicos

### Mejorado desde P1-LEGACY
- Código más mantenible
- Testing más fácil
- Extensibilidad mejorada

---

## [0.1.0] - 2025-12-10 (P1-LEGACY)

### Agregado
- Versión monolítica inicial
- Cálculo de tarifas básico
- API gRPC simple
- Documentación básica

---

**Leyenda:**
- ✨ Nueva característica
- 🔧 Mejora
- 🐛 Bug fix
- 📚 Documentación
- 🛠️ Herramientas
- 🐳 Docker/Infraestructura
