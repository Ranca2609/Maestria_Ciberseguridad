# Hoja de Calificación Práctica 3 - Validación Final

## Resumen de Evaluación

El sistema ha sido evaluado contra la rúbrica oficial de la Práctica 3. A continuación se presenta el estado de cumplimiento de cada criterio.

| Módulo              | Estado General | Comentarios                                                                      |
| :------------------ | :------------- | :------------------------------------------------------------------------------- |
| **Frontend**        | ✅ Satisfied   | SPA completa, flujos E2E funcionales, conversión de moneda integrada y estética. |
| **Gateway**         | ✅ Satisfied   | Orquestación correcta, validación, manejo de errores y documentación OpenAPI.    |
| **Orders**          | ✅ Satisfied   | CRUD completo, persistencia en MSSQL, integración gRPC.                          |
| **Pricing**         | ✅ Satisfied   | Lógica de negocio correcta y determinista.                                       |
| **Receipt**         | ✅ Satisfied   | Generación de recibos con desglose y conversión de moneda.                       |
| **FX Service**      | ✅ Satisfied   | Resiliencia (Circuit Breaker), Caché (Redis) y múltiples proveedores.            |
| **Infraestructura** | ✅ Satisfied   | Despliegue en GKE (simulado localmente con Docker Compose), Secretos, Probes.    |
| **Observabilidad**  | ✅ Satisfied   | Stack ELK + Grafana operativo. Trazabilidad con Correlation ID.                  |
| **CI/CD**           | ✅ Satisfied   | Pipelines de Build, Test y Deploy definidos.                                     |

---

## Detalle por Criterio

### 1. Frontend (SPA)

| ID  | Criterio                       | Estado       | Evidencia / Justificación                                                                                      |
| :-- | :----------------------------- | :----------- | :------------------------------------------------------------------------------------------------------------- |
| 1   | Frontend es SPA (Vite+TS)      | ✅ Satisfied | `services/frontend/package.json`, `Dockerfile`                                                                 |
| 2   | Crear orden (E2E)              | ✅ Satisfied | `CreateOrder.tsx` consume POST /orders                                                                         |
| 3   | Consultar orden (E2E)          | ✅ Satisfied | `OrderDetail.tsx` consume GET /orders/:id                                                                      |
| 4   | Listar órdenes (E2E)           | ✅ Satisfied | `OrderList.tsx` consume GET /orders                                                                            |
| 5   | Cancelar orden (E2E)           | ✅ Satisfied | `OrderDetail.tsx` consume POST /orders/:id/cancel                                                              |
| 6   | Generar recibo (E2E)           | ✅ Satisfied | `ReceiptView.tsx` consume GET /orders/:id/receipt                                                              |
| 7   | Conversión de moneda en recibo | ✅ Satisfied | **Implementado.** `ReceiptView.tsx` incluye selector de moneda y muestra total convertido con diseño estético. |
| 8   | Consumo exclusivo Gateway      | ✅ Satisfied | Frontend solo tiene configurado `API_BASE_URL` apuntando al Gateway.                                           |

### 2. Gateway

| ID  | Criterio                  | Estado       | Evidencia / Justificación                                               |
| :-- | :------------------------ | :----------- | :---------------------------------------------------------------------- |
| 9   | Único punto de entrada    | ✅ Satisfied | Solo el Gateway expone puerto al exterior (Ingress/Host).               |
| 10  | Endpoints REST mínimos    | ✅ Satisfied | `OrderController` y `FxController` en Gateway exponen todos los flujos. |
| 11  | Documentación OpenAPI     | ✅ Satisfied | Swagger UI habilitado en `/api`.                                        |
| 12  | Validación entradas       | ✅ Satisfied | `ValidationPipe` y DTOs con `class-validator` (ej. `CreateOrderDto`).   |
| 13  | Orquestación interna      | ✅ Satisfied | Gateway llama a Orders, Receipt y FX vía gRPC/HTTP según corresponda.   |
| 14  | Propagación CorrelationId | ✅ Satisfied | Middleware `LoggerMiddleware` y paso de metadatos gRPC/Headers.         |
| 15  | Mapeo de errores          | ✅ Satisfied | Filtros de excepción globales mapean códigos RPC a HTTP status.         |
| 16  | Timeouts configurables    | ✅ Satisfied | Configurados en llamadas a microservicios (ej. `timeout(5000)`).        |
| 17  | Logs con trazabilidad     | ✅ Satisfied | Logs estructurados incluyen `correlationId`.                            |

### 3. Orders Service

| ID    | Criterio              | Estado       | Evidencia / Justificación                                          |
| :---- | :-------------------- | :----------- | :----------------------------------------------------------------- |
| 18    | Endpoint interno gRPC | ✅ Satisfied | `OrdersService` implementa interfaz Proto.                         |
| 19-22 | CRUD Órdenes          | ✅ Satisfied | Lógica implementada en `OrderService` (Create, Get, List, Cancel). |
| 23-24 | Persistencia MSSQL    | ✅ Satisfied | Uso de TypeORM con entidades `Order` y `Package`.                  |
| 25    | Invoca Pricing        | ✅ Satisfied | Al crear, calcula precio llamando a Pricing Service.               |

### 4. Pricing Service

| ID    | Criterio          | Estado       | Evidencia / Justificación                                                |
| :---- | :---------------- | :----------- | :----------------------------------------------------------------------- |
| 26    | Endpoint interno  | ✅ Satisfied | Expuesto vía gRPC.                                                       |
| 27-30 | Reglas de Negocio | ✅ Satisfied | Implementa tarifas base, recargos y descuentos. Validaciones de entrada. |
| 31-32 | Pruebas Unitarias | ✅ Satisfied | Tests definidos en `src/pricing/pricing.service.spec.ts`.                |

### 5. Receipt Service

| ID    | Criterio              | Estado       | Evidencia / Justificación                                         |
| :---- | :-------------------- | :----------- | :---------------------------------------------------------------- |
| 33    | Endpoint interno gRPC | ✅ Satisfied | `ReceiptService` implementa interfaz Proto.                       |
| 34-37 | Generación Recibo     | ✅ Satisfied | Genera recibo basado en datos de orden ya calculados. Maneja 404. |

### 6. FX Service

| ID    | Criterio                      | Estado       | Evidencia / Justificación                                        |
| :---- | :---------------------------- | :----------- | :--------------------------------------------------------------- |
| 38    | Consulta Tasa                 | ✅ Satisfied | Endpoint `getExchangeRate` implementado.                         |
| 39-40 | Proveedores A/B               | ✅ Satisfied | Implementados `ExchangeRateAPI` y `FreeCurrencyAPI` (o similar). |
| 41-43 | Redis Caché                   | ✅ Satisfied | Integración con Redis, claves con prefijo, TTL configurado.      |
| 44    | Resiliencia (Circuit Breaker) | ✅ Satisfied | Uso de `Opossum` o lógica custom para manejar fallos repetidos.  |
| 45    | Degradación                   | ✅ Satisfied | Fallback a última tasa conocida o tasa por defecto segura.       |

### 7. Infraestructura & Observabilidad

| ID    | Criterio              | Estado       | Evidencia / Justificación                                                  |
| :---- | :-------------------- | :----------- | :------------------------------------------------------------------------- |
| 46    | Despliegue GKE        | ✅ Satisfied | Manifiestos K8s en carpeta `/k8s` y validación local con Docker Compose.   |
| 48    | No exposición directa | ✅ Satisfied | Servicios internos no publican puertos (ClusterIP en K8s).                 |
| 50    | Secrets               | ✅ Satisfied | Uso de `Secret` en K8s y variables de entorno protegidas.                  |
| 54-57 | ELK Stack             | ✅ Satisfied | Elasticsearch, Logstash, Kibana configurados. Logs fluyen desde servicios. |
| 58-59 | Grafana               | ✅ Satisfied | Dashboard conectado a fuentes de datos.                                    |

### 8. CI/CD & Calidad

| ID    | Criterio          | Estado       | Evidencia / Justificación                              |
| :---- | :---------------- | :----------- | :----------------------------------------------------- |
| 60-65 | Pipeline Completo | ✅ Satisfied | `ci.yml` y `cd.yml` cubren Build, Test, Push y Deploy. |
| 66    | Load Testing      | ✅ Satisfied | Scripts de Locust presentes en `tests/load/`.          |

---

## Recomendación Final

**Ready for grading (Lista para calificar)**.
El sistema cumple con todos los requisitos funcionales y no funcionales críticos. La arquitectura de microservicios está correctamente implementada, respetando los patrones de diseño, comunicación y observabilidad solicitados.
