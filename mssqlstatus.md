# Estatus de Integración MSSQL

## 1. Integración de Base de Datos

**Estado:** ✅ Completado  
**Persistencia:** ✅ Verificada (Los datos sobreviven al reinicio de contenedores)

### Componentes Implementados

- **Repositorio MSSQL**: `MssqlOrderRepository` implementado con soporte de transacciones para órdenes y paquetes.
- **Inyección de Dependencias**: Selección dinámica entre `InMemory` y `Mssql` basado en variables de entorno.
- **Manejo de Conexiones**: `DatabaseService` gestiona el pool de conexiones eficiente.
- **Migración de Docker**: Configuración optimizada en `docker-compose.local.yml`.

### Verificación Técnica

- Se corrigió el problema de `client_name` requerida en la base de datos (se añade por default en el repositorio).
- Se validó la inserción vía API Gateway (`POST /v1/orders`).
- Se confirmó la existencia de datos mediante consultas directas SQLCMD.

---

## 2. Monitoreo y Observabilidad

Para asegurar la salud de la integración MSSQL, se implementó un pipeline completo de logging.

### Pipeline de Logs

**Flujo:** `Servicios` → `Docker GELF Driver` → `Logstash (UDP 12201)` → `Elasticsearch` → `Kibana/Grafana`

**Estado:** ✅ Operativo

### Herramientas de Visualización

#### Grafana

- **URL**: http://localhost:3001
- **Credenciales**: `admin` / `quetzalship`
- **Dashboard**: "QuetzalShip - Logs Overview" (Pre-provisioned)
- **Utilidad**: Visualización de métricas de logs, errores de conexión a DB, y volumen de transacciones.

#### Kibana

- **URL**: http://localhost:5601
- **Utilidad**: Búsqueda profunda de logs (Discover), trazabilidad de errores específicos de SQL.

### Verificar Estado de MSSQL vía Logs

En Grafana o Kibana, buscar:

```
tag.keyword:"orders" AND message:*MSSQL*
```

Esto mostrará eventos de conexión y transacciones exitosas/fallidas.
