# 📊 Resumen de Configuración de Observabilidad

## ✅ Implementación Completada

### 1. **Stack de Observabilidad Configurado**

#### Elasticsearch
- ✅ Puerto: 9200
- ✅ Índices: `quetzalship-logs-YYYY.MM.DD`
- ✅ Sin autenticación (desarrollo)
- ✅ Health check configurado

#### Logstash
- ✅ Puerto GELF: 12201 (UDP)
- ✅ Pipeline mejorado con extracción de campos
- ✅ Normalización de niveles de log
- ✅ Extracción automática de: correlationId, serviceName, logLevel, httpMethod, httpUrl, httpStatus, duration

#### Grafana
- ✅ Puerto: 3001
- ✅ Credenciales: admin / quetzalship
- ✅ Datasource Elasticsearch configurado automáticamente
- ✅ 2 Dashboards: básico y avanzado

---

### 2. **Middleware de Correlation ID (Gateway)**

#### Archivos Creados:
```
services/gateway/src/middleware/
├── correlation-id.middleware.ts  ← Genera/extrae correlationId
├── logger.middleware.ts          ← Logger estructurado HTTP
└── index.ts                      ← Exports
```

#### Funcionalidad:
- ✅ Genera UUID v4 automático si no existe
- ✅ Acepta header `X-Correlation-ID` del cliente
- ✅ Propaga en respuesta como `X-Correlation-ID`
- ✅ Disponible en `req.correlationId` para downstream
- ✅ Logs estructurados en formato JSON

#### Integración:
```typescript
// gateway.module.ts
consumer
  .apply(CorrelationIdMiddleware, LoggerMiddleware)
  .forRoutes('*');
```

---

### 3. **Dashboard de Grafana Avanzado**

#### Archivo:
```
docker/grafana/provisioning/dashboards/quetzalship-advanced-logs.json
```

#### Paneles Incluidos:

1. **Errores Totales** (Stat)
   - Conteo en tiempo real de errores
   - Filtrable por servicio

2. **Logs por Nivel en el Tiempo** (Time Series)
   - Gráfico de líneas por nivel (info/warn/error)
   - Colores diferenciados
   - Stacking deshabilitado para mejor visualización

3. **Conteo de Errores por Servicio** (Time Series - Bars)
   - Distribución de errores por microservicio
   - Vista en barras apiladas
   - Actualización cada 5 segundos

4. **Distribución por Servicio** (Pie Chart)
   - Porcentaje de logs por servicio
   - Leyenda con valores absolutos

5. **Logs Recientes** (Logs Panel)
   - Vista detallada de logs
   - JSON prettified
   - 500 logs por query

#### Variables (Filtros):

| Variable       | Tipo      | Valores                          | Default |
|----------------|-----------|----------------------------------|---------|
| `$service`     | Multi     | gateway, orders, pricing, etc.   | All     |
| `$level`       | Multi     | info, warn, error, debug         | All     |
| `$correlationId` | Text    | UUID o wildcard                  | *       |

#### Features:
- ✅ Auto-refresh cada 5 segundos
- ✅ Time range: últimos 15 minutos (configurable)
- ✅ Búsqueda en tiempo real
- ✅ Cross-filtering entre paneles

---

### 4. **Logger Estructurado para Microservicios**

#### Archivo:
```
services/shared/logger.ts
```

#### Uso:
```typescript
import { createLogger } from '../shared/logger';

const logger = createLogger('pricing');

logger.info('Calculating price', { orderId, total: 125.50 });
logger.warn('High load detected', { activeRequests: 150 });
logger.error('Failed to connect', error, { service: 'database' });
```

#### Output:
```json
{
  "timestamp": "2025-12-26T10:30:45.123Z",
  "level": "info",
  "service": "pricing",
  "message": "Calculating price",
  "orderId": "ord_123",
  "total": 125.50
}
```

---

### 5. **Pipeline de Logstash Mejorado**

#### Mejoras Implementadas:

1. **Extracción de Campos:**
   - ✅ correlationId
   - ✅ serviceName (desde tag o parsed.service)
   - ✅ logLevel (normalizado a lowercase)
   - ✅ httpMethod, httpUrl, httpStatus
   - ✅ duration

2. **Procesamiento:**
   - ✅ Parseo JSON con fallback
   - ✅ Timestamp ISO8601
   - ✅ Default logLevel = "info"
   - ✅ Metadata para índices dinámicos

3. **Salida:**
   - ✅ Elasticsearch con índices diarios
   - ✅ Template preparado para mapping optimizado

---

### 6. **Documentación**

#### Archivos Creados:

1. **docs/OBSERVABILITY.md**
   - Guía completa de uso
   - Configuración de filtros
   - Troubleshooting
   - Queries útiles

2. **scripts/generate-test-logs.sh** (Bash)
   - Script para generar logs de prueba
   - Múltiples escenarios (success, error, warn)
   - Muestra correlation IDs

3. **scripts/generate-test-logs.ps1** (PowerShell)
   - Versión Windows del script anterior
   - Misma funcionalidad

---

## 🚀 Cómo Usar

### Levantar el Stack

```bash
docker compose -f docker-compose.local.yml up -d
```

### Acceder a Grafana

1. Abrir: http://localhost:3001
2. Login: `admin` / `quetzalship`
3. Ir a: **Dashboards** → **QuetzalShip - Logs Avanzados**

### Generar Logs de Prueba

**Linux/Mac:**
```bash
chmod +x scripts/generate-test-logs.sh
./scripts/generate-test-logs.sh
```

**Windows PowerShell:**
```powershell
.\scripts\generate-test-logs.ps1
```

### Rastrear Request Completo

1. Hacer un request al API:
   ```bash
   curl -v http://localhost:3000/api/v1/orders/...
   ```

2. Copiar el `X-Correlation-ID` del response header

3. En Grafana, pegar el ID en el filtro "Correlation ID"

4. Ver todos los logs relacionados con esa request específica

---

## 📊 Queries de Ejemplo

### En Grafana (Elasticsearch Query)

```
# Todos los errores del gateway
logLevel:error AND serviceName:gateway

# Requests lentos (>1000ms)
duration:>1000ms

# Errores HTTP 5xx
httpStatus:5* AND logLevel:error

# Logs de un correlationId específico
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### En Kibana (Discover)

```
# Errores de los últimos 5 minutos
logLevel:error AND @timestamp:[now-5m TO now]

# Requests POST al endpoint /orders
httpMethod:POST AND httpUrl:"/api/v1/orders"

# Logs con errores de un servicio específico
serviceName:orders AND logLevel:error
```

---

## ✅ Checklist de Verificación

### Stack Levantado
- [ ] Elasticsearch responde en http://localhost:9200
- [ ] Logstash acepta conexiones GELF en 12201/udp
- [ ] Grafana accesible en http://localhost:3001
- [ ] Gateway responde en http://localhost:3000

### Logs Funcionando
- [ ] `docker logs quetzalship-gateway` muestra JSON
- [ ] Elasticsearch tiene índices `quetzalship-logs-*`
- [ ] Grafana muestra datos en el dashboard

### Correlation ID
- [ ] Responses del Gateway incluyen header `X-Correlation-ID`
- [ ] Logs contienen campo `correlationId`
- [ ] Búsqueda por correlationId funciona en Grafana

### Dashboard
- [ ] Filtros de Servicio funcionan
- [ ] Filtros de Nivel funcionan
- [ ] Campo de Correlation ID permite búsqueda
- [ ] Paneles se actualizan automáticamente

---

## 🎯 Métricas Disponibles

El dashboard permite visualizar:

1. ✅ **Tasa de errores** total y por servicio
2. ✅ **Distribución de logs** por nivel (info/warn/error)
3. ✅ **Tendencias temporales** de errores
4. ✅ **Rendimiento** (duración de requests)
5. ✅ **Rastreo end-to-end** con correlationId
6. ✅ **Logs detallados** con búsqueda en tiempo real

---

## 📁 Archivos Modificados/Creados

```
docker/
├── grafana/provisioning/
│   ├── datasources/
│   │   └── datasources.yaml                          ← Actualizado (UID agregado)
│   └── dashboards/
│       └── quetzalship-advanced-logs.json            ← NUEVO
├── logstash/pipeline/
│   └── logstash.conf                                 ← Actualizado (más campos)

services/
├── gateway/src/
│   ├── middleware/
│   │   ├── correlation-id.middleware.ts              ← NUEVO
│   │   ├── logger.middleware.ts                      ← NUEVO
│   │   └── index.ts                                  ← NUEVO
│   └── gateway.module.ts                             ← Actualizado (middleware aplicado)
└── shared/
    └── logger.ts                                     ← NUEVO

docs/
└── OBSERVABILITY.md                                  ← NUEVO

scripts/
├── generate-test-logs.sh                             ← NUEVO
└── generate-test-logs.ps1                            ← NUEVO
```

---

## 🔧 Próximos Pasos (Opcional)

### Mejoras Sugeridas:

1. **Propagación de correlationId a gRPC:**
   - Agregar metadata en llamadas gRPC
   - Middleware en microservicios Orders, Pricing, Receipt

2. **Alertas en Grafana:**
   - Alertas cuando errores > umbral
   - Notificaciones por email/Slack

3. **Métricas de Performance:**
   - Agregar datasource Prometheus
   - Métricas de CPU, memoria, requests/sec

4. **Índices optimizados:**
   - ILM (Index Lifecycle Management)
   - Rollover automático de índices antiguos

5. **Seguridad:**
   - Autenticación en Elasticsearch
   - HTTPS en Grafana

---

**Fecha:** 26 de diciembre de 2025  
**Estado:** ✅ Implementación Completa  
**Próximo paso:** Levantar el stack y generar logs de prueba
