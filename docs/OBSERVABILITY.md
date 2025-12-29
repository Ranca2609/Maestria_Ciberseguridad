# 📊 Configuración de Observabilidad - QuetzalShip

## Stack de Observabilidad

Este proyecto incluye un stack completo de observabilidad basado en:

- **Elasticsearch**: Almacenamiento de logs indexados
- **Logstash**: Pipeline de procesamiento de logs
- **Grafana**: Visualización y dashboards
- **Kibana**: Exploración de logs (opcional)

## 🚀 Inicio Rápido

### 1. Levantar el Stack

```bash
docker compose -f docker-compose.local.yml up -d
```

### 2. Acceder a las Interfaces

| Servicio      | URL                          | Credenciales          |
|---------------|------------------------------|-----------------------|
| Grafana       | http://localhost:3001        | admin / quetzalship   |
| Kibana        | http://localhost:5601        | -                     |
| Elasticsearch | http://localhost:9200        | -                     |
| Gateway API   | http://localhost:3000        | -                     |
| Swagger Docs  | http://localhost:3000/api    | -                     |

### 3. Ver Logs en Grafana

1. Abre **Grafana** en http://localhost:3001
2. Login: `admin` / `quetzalship`
3. Ve a **Dashboards** → **QuetzalShip - Logs Avanzados**

## 📈 Dashboards Disponibles

### Dashboard Principal: "QuetzalShip - Logs Avanzados"

Incluye los siguientes paneles:

#### 1. **Errores Totales** (Stat Panel)
- Muestra el conteo total de errores
- Se actualiza cada 5 segundos
- Filtrable por servicio

#### 2. **Logs por Nivel en el Tiempo** (Time Series)
- Gráfico de líneas que muestra logs info/warn/error
- Colores:
  - 🔵 **Azul**: Info
  - 🟠 **Naranja**: Warning
  - 🔴 **Rojo**: Error

#### 3. **Conteo de Errores por Servicio** (Time Series - Bars)
- Muestra distribución de errores por servicio
- Vista en tiempo real
- Stacking para comparar servicios

#### 4. **Distribución por Servicio** (Pie Chart)
- Porcentaje de logs por cada microservicio
- Leyenda con valores absolutos

#### 5. **Logs Recientes** (Logs Panel)
- Vista detallada de logs individuales
- Búsqueda y filtrado en tiempo real
- Prettified JSON

## 🔍 Filtros Disponibles

### Variables de Dashboard

#### 1. **Servicio** (`$service`)
- Dropdown multi-selección
- Opciones: gateway, orders, pricing, receipt, fx
- Default: "All"

#### 2. **Nivel** (`$level`)
- Dropdown multi-selección
- Opciones: info, warn, error, debug
- Default: "All"

#### 3. **Correlation ID** (`$correlationId`)
- Campo de texto libre
- Permite buscar por ID de correlación específico
- Default: "*" (todos)
- Ejemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Uso de Filtros

1. **Filtrar por servicio específico:**
   - Selecciona "gateway" en el dropdown de Servicio
   
2. **Ver solo errores:**
   - Selecciona "error" en el dropdown de Nivel
   
3. **Rastrear request completo:**
   - Copia el `correlationId` del header de respuesta
   - Pégalo en el campo "Correlation ID"
   - Ve todos los logs relacionados con esa request

## 🔗 Propagación de Correlation ID

### En el Gateway

El Gateway automáticamente:
1. Genera un `correlationId` único (UUID v4) para cada request
2. Lo propaga como header `X-Correlation-ID` en la respuesta
3. Lo incluye en todos los logs

### Ejemplo de Request

```bash
# Request sin correlation ID (se genera automáticamente)
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "originZone": "METRO",
    "destinationZone": "INTERIOR",
    "serviceType": "EXPRESS",
    "packages": [{
      "weightKg": 5,
      "heightCm": 30,
      "widthCm": 20,
      "lengthCm": 40,
      "fragile": false
    }]
  }'

# Response incluirá:
# X-Correlation-ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

```bash
# Request con correlation ID específico
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: my-custom-id-12345" \
  -d '{ ... }'
```

## 📝 Estructura de Logs

### Formato JSON

Todos los logs siguen este formato:

```json
{
  "timestamp": "2025-12-26T10:30:45.123Z",
  "level": "info",
  "service": "gateway",
  "message": "Request completed",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "method": "POST",
  "url": "/api/v1/orders",
  "statusCode": 201,
  "duration": "125ms"
}
```

### Campos Principales

| Campo          | Descripción                                  | Ejemplo                                  |
|----------------|----------------------------------------------|------------------------------------------|
| timestamp      | Timestamp ISO 8601                           | 2025-12-26T10:30:45.123Z                |
| level          | Nivel de log (info/warn/error/debug)         | info                                     |
| service        | Nombre del microservicio                     | gateway, orders, pricing                 |
| message        | Mensaje descriptivo                          | "Request completed"                      |
| correlationId  | ID único para rastrear requests              | UUID v4                                  |
| method         | Método HTTP (solo en gateway)                | POST, GET, PUT, DELETE                   |
| url            | URL del endpoint                             | /api/v1/orders                           |
| statusCode     | Código de respuesta HTTP                     | 200, 201, 400, 500                       |
| duration       | Duración de la operación                     | "125ms"                                  |

## 🔧 Configuración Avanzada

### Modificar Intervalo de Refresh

Por defecto, el dashboard se actualiza cada 5 segundos. Para cambiar:

1. Ve al dashboard
2. Click en el ícono de "Refresh" (arriba derecha)
3. Selecciona: 10s, 30s, 1m, etc.

### Agregar Nuevos Paneles

1. Click en "Add panel"
2. Selecciona datasource: **Elasticsearch**
3. Configura query: `serviceName:gateway AND logLevel:error`
4. Ajusta visualización y guarda

### Crear Alertas

Grafana permite crear alertas basadas en queries:

```
Query: logLevel:error
Condition: Count > 10 in last 5 minutes
Notification: Email, Slack, etc.
```

## 🐛 Troubleshooting

### Los logs no aparecen en Grafana

1. **Verifica Elasticsearch:**
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```
   Deberías ver índices `quetzalship-logs-YYYY.MM.DD`

2. **Verifica Logstash:**
   ```bash
   docker logs quetzalship-logstash
   ```

3. **Verifica que los servicios estén logueando:**
   ```bash
   docker logs quetzalship-gateway
   ```

### Correlation ID no aparece

1. Verifica que el middleware esté configurado en el Gateway
2. Revisa que el pipeline de Logstash esté extrayendo el campo
3. Verifica en Kibana que el campo existe:
   - http://localhost:5601
   - Discover → Busca `correlationId`

### Dashboard no muestra datos

1. Verifica el rango de tiempo (arriba derecha)
2. Cambia a "Last 15 minutes" o "Last 1 hour"
3. Verifica que hay tráfico en la aplicación
4. Ejecuta algunos requests de prueba

## 📚 Recursos Adicionales

- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Logstash Filters](https://www.elastic.co/guide/en/logstash/current/filter-plugins.html)

## 🎯 Queries Útiles

### En Kibana (Discover)

```
# Todos los errores
logLevel:error

# Errores del gateway
logLevel:error AND serviceName:gateway

# Requests lentos (>1000ms)
duration:>1000ms

# Errores HTTP 5xx
httpStatus:5* AND logLevel:error

# Logs de un correlationId específico
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### En Grafana (Panel Queries)

```
# Errores por servicio
logLevel:error AND serviceName:$service

# Requests HTTP exitosos
httpStatus:2* AND serviceName:gateway

# Todos los logs de un correlation ID
correlationId:$correlationId
```

## 📊 Métricas Clave

El dashboard te permite monitorear:

1. ✅ **Tasa de errores** por servicio
2. ✅ **Distribución de logs** por nivel
3. ✅ **Rendimiento** (duración de requests)
4. ✅ **Rastreo end-to-end** con correlationId
5. ✅ **Patrones temporales** de errores

---

**Última actualización:** 26 de diciembre de 2025
