# Integrantes del Equipo

## Grupo: Software Avanzado - Práctica 2

| # | Nombre Completo | Carné | Rol |
|---|----------------|-------|-----|
| 1 | [Nombre Integrante 1] | [Carné 1] | Pricing Service + Contracts |
| 2 | [Nombre Integrante 2] | [Carné 2] | Orders Service |
| 3 | [Nombre Integrante 3] | [Carné 3] | Receipt Service + Gateway |
| 4 | [Nombre Integrante 4] | [Carné 4] | Frontend + Docker |
| 5 | [Nombre Integrante 5] | [Carné 5] | CI/CD + Documentation |

## Distribución de Tareas - Práctica 2

### Integrante 1 - Pricing Service + Contracts
- Archivos proto (contracts/proto/*.proto)
- OpenAPI spec (contracts/openapi/quetzalship-gateway.yaml)
- Pricing Service completo (services/pricing/*)
- Unit tests del calculador de precios

### Integrante 2 - Orders Service
- Orders Service completo (services/orders/*)
- Implementación de idempotencia
- Repositorio en memoria
- Integración con Pricing Service vía gRPC

### Integrante 3 - Receipt Service + Gateway
- Receipt Service (services/receipt/*)
- Gateway REST (services/gateway/*)
- Swagger/OpenAPI integration
- Health checks y resiliencia (timeout/retry)

### Integrante 4 - Frontend + Docker
- Frontend Vite + React (services/frontend/*)
- Dockerfiles de todos los servicios
- docker-compose.yml
- nginx.conf para frontend

### Integrante 5 - CI/CD + Documentation
- GitHub Actions workflow (.github/workflows/ci.yml)
- README.md actualizado
- INTEGRANTES.md
- Gestión de tags y versionamiento

---

## Arquitectura del Sistema

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
            └───────────┘ └───────────┘ └───────────┘
```

## Tecnologías Utilizadas

| Componente | Tecnología |
|------------|------------|
| Backend Services | NestJS + TypeScript |
| Comunicación Interna | gRPC + Protocol Buffers |
| API Externa | REST + OpenAPI 3.0 |
| Frontend | Vite + React + TypeScript |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Servidor Frontend | nginx |

---

**Nota:** Reemplazar los datos entre corchetes con la información real de cada integrante.
