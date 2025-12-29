# GitFlow para Práctica 2 - 6 Integrantes

## Resumen de Distribución

| Int | Rol | FILES | LOC | ÍNDICE | NOTA |
|-----|-----|-------|-----|--------|------|
| 1 | Contracts + Pricing Calculators | 12 | 1186 | 16.53 | 93.1% |
| 2 | Pricing Service + Tests | 11 | 1062 | 15.25 | 90.5% |
| 3 | Orders + Receipt Services | 21 | 743 | 16.48 | 93.0% |
| 4 | Gateway Service | 13 | 925 | 14.94 | 89.9% |
| 5 | Frontend Components | 13 | 1270 | 17.52 | 95.0% |
| 6 | Infrastructure + Docs | 13 | 1505 | 19.28 | 98.6% |

**Comando de evaluación:**
```bash
git fame -w --excl '(^|/)(package-lock\.json|npm-shrinkwrap\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb|bun\.lock|deno\.lock|Cargo\.lock|poetry\.lock|Pipfile\.lock|composer\.lock|Gemfile\.lock|packages\.lock\.json|Package\.resolved|mix\.lock|pubspec\.lock|gradle\.lockfile)$'
```

---

## PASO 0: Preparación (Líder del equipo)

```bash
# 1. Clonar el repositorio
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad

# 2. Hacer reset al punto ANTES de P2 (commit 8eb59cc)
git reset --hard 8eb59cc

# 3. Forzar push para limpiar la rama
git push --force origin main

# 4. Crear rama develop para P2
git checkout -b develop/P2
git push -u origin develop/P2
```

---

## INSTRUCCIONES POR INTEGRANTE

### INTEGRANTE 1: Contracts + Pricing Calculators
**Rama:** `feature/P2-contracts-calculators`

```bash
# 1. Clonar y crear rama
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad
git checkout -b feature/P2-contracts-calculators

# 2. Configurar usuario (IMPORTANTE para git fame)
git config user.name "Nombre Integrante 1"
git config user.email "correo1@ejemplo.com"

# 3. Crear estructura de directorios
mkdir -p contracts/proto contracts/openapi
mkdir -p services/pricing/src/{interfaces,calculators}

# 4. Copiar archivos (desde el backup compartido)
# contracts/proto/pricing.proto
# contracts/proto/orders.proto
# contracts/proto/receipt.proto
# contracts/openapi/quetzalship-gateway.yaml
# services/pricing/src/interfaces/pricing.interface.ts
# services/pricing/src/calculators/*.ts (7 archivos)

# 5. Hacer 5 commits
git add contracts/proto/pricing.proto services/pricing/src/calculators/pricing.calculator.ts services/pricing/src/calculators/discount.calculator.ts
git commit -m "feat(contracts): add pricing proto and main calculators"

git add contracts/proto/orders.proto services/pricing/src/calculators/package.calculator.ts services/pricing/src/calculators/index.ts
git commit -m "feat(contracts): add orders proto and package calculator"

git add contracts/proto/receipt.proto services/pricing/src/calculators/rate.calculator.ts
git commit -m "feat(contracts): add receipt proto and rate calculator"

git add contracts/openapi/quetzalship-gateway.yaml services/pricing/src/calculators/service.calculator.ts
git commit -m "feat(contracts): add OpenAPI spec and service calculator"

git add services/pricing/src/interfaces/pricing.interface.ts services/pricing/src/calculators/surcharge.calculator.ts
git commit -m "feat(pricing): add pricing interfaces and surcharge calculator"

# 6. Push
git push -u origin feature/P2-contracts-calculators
```

---

### INTEGRANTE 2: Pricing Service + Tests
**Rama:** `feature/P2-pricing-service`

```bash
# 1. Clonar y crear rama
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad
git checkout -b feature/P2-pricing-service

# 2. Configurar usuario
git config user.name "Nombre Integrante 2"
git config user.email "correo2@ejemplo.com"

# 3. Crear estructura
mkdir -p services/pricing/{src,test}
mkdir -p services/orders/src/{interfaces,services}

# 4. Copiar archivos:
# services/pricing/test/pricing.calculator.spec.ts
# services/pricing/src/pricing.controller.ts
# services/pricing/src/pricing.module.ts
# services/pricing/src/main.ts
# services/pricing/package.json, tsconfig.json, nest-cli.json, Dockerfile
# services/orders/src/interfaces/order.interface.ts
# services/orders/src/services/order.service.ts, index.ts

# 5. Hacer 5 commits
git add services/pricing/test/pricing.calculator.spec.ts services/pricing/tsconfig.json services/orders/src/services/index.ts
git commit -m "feat(pricing): add unit tests and tsconfig"

git add services/pricing/src/pricing.controller.ts services/pricing/nest-cli.json
git commit -m "feat(pricing): add pricing controller and nest config"

git add services/pricing/src/pricing.module.ts services/pricing/Dockerfile
git commit -m "feat(pricing): add pricing module and Dockerfile"

git add services/pricing/src/main.ts services/orders/src/interfaces/order.interface.ts
git commit -m "feat(pricing): add main entry and order interfaces"

git add services/pricing/package.json services/orders/src/services/order.service.ts
git commit -m "feat(pricing): add package.json and order service"

# 6. Push
git push -u origin feature/P2-pricing-service
```

---

### INTEGRANTE 3: Orders + Receipt Services
**Rama:** `feature/P2-orders-receipt`

```bash
# 1. Clonar y crear rama
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad
git checkout -b feature/P2-orders-receipt

# 2. Configurar usuario
git config user.name "Nombre Integrante 3"
git config user.email "correo3@ejemplo.com"

# 3. Crear estructura
mkdir -p services/orders/src/{controllers,repositories}
mkdir -p services/receipt/src/{interfaces,generators}

# 4. Copiar archivos (21 archivos de orders y receipt)

# 5. Hacer 5 commits
git add services/orders/src/repositories/order.repository.ts services/orders/src/orders.module.ts services/orders/Dockerfile services/receipt/src/receipt.module.ts services/receipt/Dockerfile
git commit -m "feat(orders): add order repository and module structure"

git add services/orders/src/repositories/idempotency.store.ts services/orders/src/main.ts services/receipt/src/interfaces/receipt.interface.ts services/receipt/src/main.ts
git commit -m "feat(orders): add idempotency store and receipt interfaces"

git add services/orders/src/repositories/index.ts services/orders/package.json services/receipt/src/generators/receipt.generator.ts services/receipt/package.json
git commit -m "feat(orders): add repositories index and receipt generator"

git add services/orders/src/controllers/order.controller.ts services/orders/tsconfig.json services/receipt/src/generators/index.ts services/receipt/tsconfig.json
git commit -m "feat(orders): add order controller and configs"

git add services/orders/src/controllers/index.ts services/orders/nest-cli.json services/receipt/src/receipt.controller.ts services/receipt/nest-cli.json
git commit -m "feat(orders): add controller indexes and receipt controller"

# 6. Push
git push -u origin feature/P2-orders-receipt
```

---

### INTEGRANTE 4: Gateway Service
**Rama:** `feature/P2-gateway`

```bash
# 1. Clonar y crear rama
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad
git checkout -b feature/P2-gateway

# 2. Configurar usuario
git config user.name "Nombre Integrante 4"
git config user.email "correo4@ejemplo.com"

# 3. Crear estructura
mkdir -p services/gateway/src/{dto,services,controllers}

# 4. Copiar archivos (13 archivos de gateway)

# 5. Hacer 5 commits
git add services/gateway/src/dto/order.dto.ts services/gateway/src/controllers/health.controller.ts services/gateway/tsconfig.json
git commit -m "feat(gateway): add DTOs and health controller"

git add services/gateway/src/dto/index.ts services/gateway/src/controllers/index.ts services/gateway/nest-cli.json
git commit -m "feat(gateway): add index files and nest config"

git add services/gateway/src/services/gateway.service.ts services/gateway/src/gateway.module.ts services/gateway/Dockerfile
git commit -m "feat(gateway): add gateway service and module"

git add services/gateway/src/services/index.ts services/gateway/src/main.ts
git commit -m "feat(gateway): add service index and main entry"

git add services/gateway/src/controllers/order.controller.ts services/gateway/package.json
git commit -m "feat(gateway): add order controller and package.json"

# 6. Push
git push -u origin feature/P2-gateway
```

---

### INTEGRANTE 5: Frontend Components
**Rama:** `feature/P2-frontend-components`

```bash
# 1. Clonar y crear rama
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad
git checkout -b feature/P2-frontend-components

# 2. Configurar usuario
git config user.name "Nombre Integrante 5"
git config user.email "correo5@ejemplo.com"

# 3. Crear estructura
mkdir -p services/frontend/src/{components,types,services,styles}

# 4. Copiar archivos (13 archivos de frontend/src)

# 5. Hacer 5 commits
git add services/frontend/src/styles/index.css services/frontend/src/components/index.ts services/frontend/src/App.tsx
git commit -m "feat(frontend): add styles and App component"

git add services/frontend/src/components/CreateOrder.tsx services/frontend/src/types/order.types.ts services/frontend/src/main.tsx
git commit -m "feat(frontend): add CreateOrder component and types"

git add services/frontend/src/components/OrderDetail.tsx services/frontend/src/types/index.ts services/frontend/src/vite-env.d.ts
git commit -m "feat(frontend): add OrderDetail component and type exports"

git add services/frontend/src/components/OrderList.tsx services/frontend/src/services/api.service.ts
git commit -m "feat(frontend): add OrderList and API service"

git add services/frontend/src/components/ReceiptView.tsx services/frontend/src/services/index.ts
git commit -m "feat(frontend): add ReceiptView component"

# 6. Push
git push -u origin feature/P2-frontend-components
```

---

### INTEGRANTE 6: Infrastructure + Docs
**Rama:** `feature/P2-infrastructure`

```bash
# 1. Clonar y crear rama
git clone <URL_REPOSITORIO>
cd Maestria_Ciberseguridad
git checkout -b feature/P2-infrastructure

# 2. Configurar usuario
git config user.name "Nombre Integrante 6"
git config user.email "correo6@ejemplo.com"

# 3. Crear estructura
mkdir -p .github/workflows docs/postman services/frontend

# 4. Copiar archivos (13 archivos de infra + docs)

# 5. Hacer 5 commits
git add docs/postman/QuetzalShip.postman_collection.json INTEGRANTES.md services/frontend/index.html
git commit -m "docs: add Postman collection and team info"

git add README.md services/frontend/package.json services/frontend/Dockerfile
git commit -m "docs: add README and frontend package config"

git add .github/workflows/ci.yml services/frontend/tsconfig.json services/frontend/nginx.conf
git commit -m "ci: add GitHub Actions workflow and nginx config"

git add docker-compose.yml services/frontend/tsconfig.node.json
git commit -m "infra: add docker-compose configuration"

git add docker-compose.dev.yml services/frontend/vite.config.ts
git commit -m "infra: add dev docker-compose and vite config"

# 6. Push
git push -u origin feature/P2-infrastructure
```

---

## PASO FINAL: Merge (Líder del equipo)

```bash
# 1. En la rama develop/P2, hacer merge de todas las ramas
git checkout develop/P2

git merge feature/P2-contracts-calculators --no-ff -m "Merge contracts and calculators"
git merge feature/P2-pricing-service --no-ff -m "Merge pricing service"
git merge feature/P2-orders-receipt --no-ff -m "Merge orders and receipt services"
git merge feature/P2-gateway --no-ff -m "Merge gateway service"
git merge feature/P2-frontend-components --no-ff -m "Merge frontend components"
git merge feature/P2-infrastructure --no-ff -m "Merge infrastructure and docs"

# 2. Push final
git push origin develop/P2

# 3. Crear tag
git tag -a P2-MICROSERVICES -m "Práctica 2: Arquitectura de Microservicios"
git push origin P2-MICROSERVICES

# 4. Verificar con git fame
git fame -w --excl '(^|/)(package-lock\.json|...)$'
```

---

## Notas Importantes

1. **IMPORTANTE**: Cada integrante debe configurar su `user.name` y `user.email` antes de hacer commits
2. Los archivos deben copiarse desde el backup compartido
3. El orden de merge importa para evitar conflictos
4. Si hay conflictos, resolverlos manteniendo todos los archivos
5. Verificar con `git fame -w` que la distribución sea correcta
