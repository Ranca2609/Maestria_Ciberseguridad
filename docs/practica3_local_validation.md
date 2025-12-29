# Validación Local Práctica 3 - QuetzalShip

## Resumen Ejecutivo

El proyecto cumple sustancialmente con los requerimientos arquitectónicos y funcionales para la entrega final. Se ha verificado la implementación de Microservicios, Gateway, Resilience (Circuit Breaker/Fallback/Cache), Orquestación, Persistencia y Observabilidad (ELK Stack).

| Categoría          | Estado       | Comentarios                                                         |
| ------------------ | ------------ | ------------------------------------------------------------------- |
| ✨ Frontend        | ✅ Satisfied | SPA completa, integración correcta con Gateway.                     |
| 🌉 Gateway         | ✅ Satisfied | Orquestación, validación y manejo de errores robusto.               |
| 📦 Services        | ✅ Satisfied | Implementación lógica correcta, persistencia y gRPC.                |
| 💱 FX & Resilience | ✅ Satisfied | Patrones de resiliencia (CB, Retry, Fallback, Cache) implementados. |
| 🛠️ Infraestructura | ✅ Satisfied | Docker Compose completo con ELK y Redis.                            |
| 📊 Observabilidad  | ✅ Satisfied | Stack ELK + Grafana configurado.                                    |
| 🧪 CI/CD           | ✅ Satisfied | Pipelines funcionales con tests unitarios, smoke y carga.           |

---

## Detalle de Evaluación

### ✨ Frontend (SPA)

| Criterio                                               | Estado       | Evidencia                                             |
| ------------------------------------------------------ | ------------ | ----------------------------------------------------- |
| 1. Implementación SPA (Vite+TS)                        | ✅ Satisfied | `services/frontend/Dockerfile`, `package.json`        |
| 2-6. Flujos E2E (Crear, Listar, Ver, Cancelar, Recibo) | ✅ Satisfied | Componentes de React y `ReceiptView.tsx` verificados. |
| 7. Conversión Moneda                                   | ✅ Satisfied | `ReceiptView.tsx` consume endpoint de conversión.     |
| 8. Consumo exclusivo Gateway                           | ✅ Satisfied | `api.ts` configura base URL hacia Gateway.            |

### 🌉 Gateway (Orquestación)

| Criterio                   | Estado       | Evidencia                                                                |
| -------------------------- | ------------ | ------------------------------------------------------------------------ |
| 9. Punto único de entrada  | ✅ Satisfied | `docker-compose.local.yml` expone puerto 3000 (Gateway).                 |
| 10. Endpoints REST         | ✅ Satisfied | `OrderController` expone GET/POST/PATCH mapeados.                        |
| 11. OpenAPI/Swagger        | ✅ Satisfied | `main.ts` configura `DocumentBuilder` en `/api`.                         |
| 12. Validación de Entradas | ✅ Satisfied | `ValidationPipe` global y DTOs (`CreateOrderDto`).                       |
| 13. Orquestación           | ✅ Satisfied | `gateway.service.ts` orquesta `getOrderForReceipt` -> `generateReceipt`. |
| 14. Correlation ID         | ✅ Satisfied | `correlation-id.middleware.ts` inyecta header `x-correlation-id`.        |
| 15. Mapeo de Errores       | ✅ Satisfied | `mapGrpcError` traduce códigos gRPC (3,5,6) a HTTP (400,404,409).        |
| 16. Timeouts               | ✅ Satisfied | Uso de operador `timeout(TIMEOUT_MS)` en llamadas RxJS.                  |
| 17. Logs con Trazabilidad  | ✅ Satisfied | Middleware de logging usa `correlationId`.                               |

### 📦 Orders & 🏷️ Pricing

| Criterio                       | Estado       | Evidencia                                                                |
| ------------------------------ | ------------ | ------------------------------------------------------------------------ |
| 18. Orders gRPC                | ✅ Satisfied | `orders.service.ts` implementa interfaz gRPC.                            |
| 19-22. CRUD Órdenes            | ✅ Satisfied | Lógica completa en `OrderService`.                                       |
| 23-24. Persistencia MSSQL      | ✅ Satisfied | `OrderRepository` guarda orden y paquetes.                               |
| 25. Invoca Pricing             | ✅ Satisfied | `OrderService.createOrder` llama a `pricingClient`.                      |
| 26. Pricing Endpoint           | ✅ Satisfied | `PricingController` gRPC operativo.                                      |
| 27-28. Reglas y Desglose       | ✅ Satisfied | `PricingCalculator` retorna breakdown detallado (peso, surcharges, etc). |
| 29-30. Validación/Determinismo | ✅ Satisfied | `Math.round` usado en cálculos. Validaciones de peso/dim.                |
| 31-32. Tests Unitarios         | ✅ Satisfied | `ci.yml` ejecuta `npm test` para pricing.                                |

### 🧾 Receipt & 💱 FX

| Criterio                  | Estado       | Evidencia                                             |
| ------------------------- | ------------ | ----------------------------------------------------- |
| 33-35. Generación Recibo  | ✅ Satisfied | `ReceiptController` genera estructura completa.       |
| 36. Usa datos persistidos | ✅ Satisfied | Gateway obtiene Orden de BD antes de pedir recibo.    |
| 38-40. FX Prov. A/B       | ✅ Satisfied | `FxService` tiene `primaryClient` y `fallbackClient`. |
| 41-43. Redis Cache        | ✅ Satisfied | `CacheService` implementado con TTL y claves por par. |
| 44. Resiliencia           | ✅ Satisfied | Uso de librería `opossum` para Circuit Breaker.       |
| 45. Degradación           | ✅ Satisfied | Fallback a tasas hardcodeadas/stale si todo falla.    |

### 🛠️ Infraestructura & 📊 Observabilidad

| Criterio       | Estado       | Evidencia                                                     |
| -------------- | ------------ | ------------------------------------------------------------- |
| 50. Secrets    | ✅ Satisfied | Variables de entorno en `docker-compose.local.yml` (FX keys). |
| 54. ELK Stack  | ✅ Satisfied | Elastic, Logstash, Kibana corriendo en Docker.                |
| 55. Logs Agent | ✅ Satisfied | Driver `gelf` configurado en todos los servicios.             |
| 58. Grafana    | ✅ Satisfied | Contenedor Grafana activo y conectado elasticsearch.          |
| 59. Dashboards | ✅ Satisfied | JSONs de provisión encontrados (`quetzalship-logs.json`).     |

### 🧪 CI/CD & Testing

| Criterio                  | Estado       | Evidencia                                       |
| ------------------------- | ------------ | ----------------------------------------------- |
| 60-61. Pipeline Build     | ✅ Satisfied | GitHub Actions `build-and-push` job.            |
| 62. Unit & Contract Tests | ✅ Satisfied | `test` job corre pruebas de servicios.          |
| 65. Smoke Test            | ✅ Satisfied | `integration-test` en CI hace cURL a endpoints. |
| 66. Load Test (Locust)    | ✅ Satisfied | `locust` service en docker-compose y job en CI. |

---

**Nota Final:**  
El proyecto **APRUEBA** los requerimientos centrales y avanzados para la implementación local. La arquitectura demuestra madurez en el manejo de fallos y orquestación de microservicios.
