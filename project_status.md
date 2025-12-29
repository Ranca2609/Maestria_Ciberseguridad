# Estado del Proyecto QuetzalShip v2.0

## ✅ Implementación Completada

### 1. Servicios Nuevos (FX Service)

El microservicio de cambio de divisas (`services/fx`) ha sido implementado exitosamente.

- **Tecnologías**: NestJS, gRPC, Redis, Opossum (Circuit Breaker).
- **Funcionalidades**:
  - **Dual-Provider**: Integra `ExchangeRate-API` (principal) y `FreeCurrencyAPI` (respaldo).
  - **Resiliencia**:
    - **Circuit Breaker**: Implementado para ambos proveedores.
    - **Retry with Backoff**: Reintentos exponenciales ante fallos.
    - **Fallback**: Cambio automático de proveedor si el principal falla.
    - **Graceful Degradation**: Uso de tasas fijas por defecto si ambos proveedores y caché fallan.
  - **Caching**: Redis almacena tasas con TTL configurable (default 5 min) para reducir llamadas a APIs externas.
  - **API**:
    - `GetExchangeRate`: Obtiene tasa entre dos monedas.
    - `Convert`: Convierte un monto.
    - `GetRates`: Obtiene tabla de tasas base.
    - `HealthCheck`: Estado detallado de proveedores y caché.

### 2. Infraestructura & Despliegue (Local & GKE)

Se han generado todos los manifiestos de Kubernetes y configuraciones locales.

- **Local Development (`docker-compose.local.yml`)**:

  - Stack completo: Microservicios + MSSQL + Redis + ELK + Grafana.
  - **MSSQL Init**: Script automático (`docker/mssql/init.sql`) que crea la DB `quetzalship` y tablas `orders` y `packages` al iniciar el contenedor.
  - **Soluciones Aplicadas**:
    - Corrección de `npm install` en Dockerfiles (eliminado `npm ci`).
    - Corrección de tipos TypeScript en `FX Service`.
    - Declaración de tipos para `opossum`.

- **Kubernetes (GKE)**:

  - Manifiestos organizados en `k8s/` (Base, Infra, Observability, Apps, Ingress).
  - Scripts de utilidad: `create-secrets.sh`, `deploy-to-gke.sh`, `rollback.sh`.

- **CI/CD (GitHub Actions)**:
  - `ci.yml`: Tests y Linting.
  - `cd.yml`: Pipeline completo de despliegue a GKE con Smoke Tests y Rollback automático.

### 3. Base de Datos (Schema)

Definido en `docker/mssql/init.sql`.

- **Tabla `orders`**:
  - Almacena información principal de la orden (cliente, zonas, costos, estado).
  - Índices en `status` y `created_at`.
- **Tabla `packages`**:
  - Detalle de paquetes asociados a una orden (peso, dimensiones).
  - Relación `1:N` con `orders`.

---

## ⏳ Tareas Pendientes (Next Steps)

Para completar la migración total a producción, faltan las siguientes fases en el código de los servicios existentes:

### 1. Orders Service (Migración a Persistencia)

Actualmente, el servicio de Órdenes guarda datos en memoria.

- [ ] Instalar `typeorm` y el driver `mssql`.
- [ ] Crear entidades TypeORM (`Order`, `Package`) que mapeen a las tablas creadas.
- [ ] Refactorizar `OrdersService` para usar repositorios TypeORM reales.
- [ ] Actualizar variables de entorno en K8s para conectar a la instancia MSSQL.

### 2. Observabilidad Distribuida

- [ ] **Gateway**: Implementar middleware para generar y propagar `X-Correlation-ID`.
- [ ] **Todos los Servicios**: Asegurar que propagan el `correlationId` en las llamadas gRPC downstream.
- [ ] Actualizar loggers existentes al formato JSON estructurado (ya implementado en FX) para mejor visualización en Kibana.

### 3. Verificación Final

- [ ] Ejecutar `smoke-test.sh` contra el entorno completo ya integrado.
- [ ] Ejecutar pruebas de carga con Locust (`tests/load/locustfile.py`).

---

## Guía de Verificación Rápida (Local)

Para levantar el entorno completo y probar lo que hoy funciona:

```bash
# 1. Instalar dependencias del nuevo servicio
cd services/fx
npm install

# 2. Levantar Docker Compose (reconstruyendo imágenes)
cd ../..
docker compose -f docker-compose.local.yml up --build

# 3. Verificar estado de servicios
# Frontend: http://localhost:4200
# Grafana: http://localhost:3001 (admin/quetzalship)
# Kibana: http://localhost:5601

# 4. Verificar Base de Datos
docker exec -it quetzalship-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "QuetzalShip2024!" -C -Q "USE quetzalship; SELECT name FROM sys.tables;"
```
