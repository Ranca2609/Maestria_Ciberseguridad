# 🔄 Validación del Servicio FX desde el Frontend

## 📋 Descripción

Se ha implementado un componente interactivo en el frontend para validar todas las funcionalidades del servicio FX (Foreign Exchange). El componente permite probar:

- ✅ Conversión de monedas
- ✅ Obtención de tasas de cambio
- ✅ Tasas múltiples para una moneda base
- ✅ Visualización de caché y proveedor
- ✅ Pruebas de degradación elegante

## 🏗️ Arquitectura de Integración

```
┌─────────────────┐
│    Frontend     │  React + TypeScript
│  Port: 4200     │  Componente: CurrencyConverter
└────────┬────────┘
         │ HTTP REST
         │
         v
┌─────────────────┐
│    Gateway      │  NestJS REST API
│  Port: 3000     │  Endpoints: /v1/fx/*
└────────┬────────┘
         │ gRPC
         │
         v
┌─────────────────┐
│   FX Service    │  NestJS gRPC
│  Port: 50055    │  Circuit Breaker + Cache
└─────────────────┘
         │
         v
  ┌──────┴───────┐
  │              │
Redis Cache    APIs Externas
TTL: 300s      (Primary + Fallback)
```

## 📂 Archivos Creados/Modificados

### Frontend

1. **`services/frontend/src/types/fx.types.ts`** (NUEVO)
   - Interfaces TypeScript para requests/responses FX
   - `ConvertRequest`, `ConvertResponse`
   - `ExchangeRateRequest`, `ExchangeRateResponse`
   - `GetRatesRequest`, `GetRatesResponse`

2. **`services/frontend/src/components/CurrencyConverter.tsx`** (NUEVO)
   - Componente React principal para validación FX
   - 3 tabs: Conversión, Tasa, Tasas Múltiples
   - Visualización de proveedor (primary/fallback/default)
   - Indicadores de caché (API vs Cache)
   - Guía de pruebas integrada

3. **`services/frontend/src/styles/currency-converter.css`** (NUEVO)
   - Estilos completos para el componente
   - Diseño responsive
   - Badges de estado (proveedor, caché)
   - Tablas de tasas múltiples

4. **`services/frontend/src/services/api.service.ts`** (MODIFICADO)
   - Agregados 3 métodos FX:
     - `convertCurrency(request)`
     - `getExchangeRate(request)`
     - `getRates(request)`

5. **`services/frontend/src/App.tsx`** (MODIFICADO)
   - Nueva ruta: `/currency`
   - NavLink: "Conversión FX" en la navegación principal

6. **`services/frontend/src/components/index.ts`** (MODIFICADO)
   - Export de `CurrencyConverter`

### Gateway

7. **`services/gateway/src/dto/fx.dto.ts`** (NUEVO)
   - DTOs con validación class-validator
   - Decoradores Swagger para documentación
   - `ConvertCurrencyDto`, `GetExchangeRateDto`, `GetRatesDto`

8. **`services/gateway/src/controllers/fx.controller.ts`** (NUEVO)
   - Controlador REST para `/v1/fx/*`
   - 3 endpoints: `POST /convert`, `POST /rate`, `POST /rates`
   - Logging completo de requests/responses
   - Manejo de errores con logging

9. **`services/gateway/src/services/fx.service.ts`** (NUEVO)
   - Cliente gRPC para servicio FX
   - Transformación snake_case ↔ camelCase
   - Uso de `firstValueFrom` para convertir Observables

10. **`services/gateway/src/gateway.module.ts`** (MODIFICADO)
    - Registro de `FX_PACKAGE` en ClientsModule
    - URL: `process.env.FX_SERVICE_URL || 'localhost:50055'`
    - Controlador `FxController` y provider `FxService`

11. **`services/gateway/proto/fx.proto`** (COPIADO)
    - Copia del contrato proto desde `contracts/proto/fx.proto`

## 🎯 Características del Componente Frontend

### Tab 1: Conversión de Moneda

```
┌─────────────────────────────────────────┐
│  Desde:  [GTQ ▼]  ⇄  Hacia:  [USD ▼]   │
│  Monto:  [100.00]                        │
│  [💱 Convertir]                          │
└─────────────────────────────────────────┘

Resultado:
✅ Monto Original: 100.00 GTQ
✅ Monto Convertido: 12.82 USD
✅ Tasa de Cambio: 0.128205
✅ Proveedor: [primary-api]
✅ Origen: [🌐 API]
✅ Timestamp: 26/12/2025 12:30:15
```

### Tab 2: Obtener Tasa

```
┌─────────────────────────────────────────┐
│  Desde:  [GTQ ▼]  ⇄  Hacia:  [USD ▼]   │
│  [📊 Obtener Tasa]                       │
└─────────────────────────────────────────┘

Resultado:
✅ Par de Monedas: GTQ → USD
✅ Tasa: 0.128205
✅ Proveedor: [primary-api]
✅ Origen: [💾 Caché] ← ¡Segunda llamada usa caché!
```

### Tab 3: Tasas Múltiples

```
┌─────────────────────────────────────────┐
│  Base:  [GTQ ▼]                          │
│  [📈 Obtener Todas las Tasas]           │
└─────────────────────────────────────────┘

Resultado (Base: GTQ):
┌──────────┬──────────┬──────────────────┐
│ Moneda   │ Tasa     │ Equivalencia     │
├──────────┼──────────┼──────────────────┤
│ USD      │ 0.128205 │ 1 GTQ = 0.13 USD │
│ EUR      │ 0.117948 │ 1 GTQ = 0.12 EUR │
│ GBP      │ 0.101282 │ 1 GTQ = 0.10 GBP │
│ MXN      │ 2.205128 │ 1 GTQ = 2.21 MXN │
└──────────┴──────────┴──────────────────┘
```

## 🧪 Guía de Validación

### 1. Iniciar los Servicios

```powershell
# Terminal 1: Iniciar todos los servicios con Docker Compose
cd c:\Users\Kevin\Documents\2025\vacasDiciembre2025\Pure\Maestria_Ciberseguridad
docker-compose -f docker-compose.dev.yml up -d

# Verificar que todos los servicios están corriendo
docker-compose -f docker-compose.dev.yml ps

# Verificar logs del FX service
docker-compose -f docker-compose.dev.yml logs fx -f
```

### 2. Acceder al Frontend

```
URL: http://localhost:4200/currency
```

O desde la navegación principal:
1. Ir a http://localhost:4200
2. Click en "Conversión FX" en el menú superior

### 3. Pruebas de Caché

**Objetivo:** Verificar que Redis cachea las tasas correctamente

1. Seleccionar: GTQ → USD, Monto: 100
2. Click "💱 Convertir"
3. Observar: Origen = "🌐 API", Proveedor = "primary-api" o "fallback-api"
4. **INMEDIATAMENTE** click "💱 Convertir" nuevamente (mismo par)
5. Observar: Origen = "💾 Caché" ✅

**Verificación adicional:**
```powershell
# Ver las keys en Redis
docker exec -it quetzalship-redis redis-cli KEYS "*"

# Ver el contenido de una key
docker exec -it quetzalship-redis redis-cli GET "fx:rate:GTQ:USD"

# Ver TTL restante (debe mostrar ~300 segundos)
docker exec -it quetzalship-redis redis-cli TTL "fx:rate:GTQ:USD"
```

### 4. Pruebas de Circuit Breaker

**Objetivo:** Ver degradación Primary → Fallback → Default

**Opción A: Simular fallo del servicio FX (degradación total)**
```powershell
# Detener el servicio FX
docker-compose -f docker-compose.dev.yml stop fx

# En el frontend, intentar conversión
# Deberías ver: "Error al convertir moneda"

# Reiniciar servicio
docker-compose -f docker-compose.dev.yml start fx
```

**Opción B: Observar logs de circuit breaker**
```powershell
# Monitorear logs del FX service
docker-compose -f docker-compose.dev.yml logs fx -f

# Buscar eventos:
# - [CircuitBreaker] open - El circuit breaker se abrió (demasiados errores)
# - [CircuitBreaker] halfOpen - Intentando recuperarse
# - [CircuitBreaker] close - Recuperado exitosamente
# - Trying fallback provider - Cambió a API secundaria
```

### 5. Pruebas de Tasas Múltiples

1. Cambiar a tab "📈 Tasas Múltiples"
2. Seleccionar moneda base: GTQ
3. Click "📈 Obtener Todas las Tasas"
4. Verificar tabla con 4 tasas (USD, EUR, GBP, MXN)
5. Repetir inmediatamente → Debe mostrar "💾 Caché"

### 6. Pruebas de TTL (Expiración de Caché)

**Objetivo:** Verificar que el caché expira después de 5 minutos

1. Hacer conversión GTQ → USD
2. Verificar: Origen = "🌐 API"
3. Repetir inmediatamente → Origen = "💾 Caché"
4. **ESPERAR 5 MINUTOS** (300 segundos)
5. Repetir conversión → Origen = "🌐 API" (caché expirado) ✅

**Verificación rápida (modificar TTL para testing):**
```bash
# En el docker-compose.dev.yml, cambiar:
FX_SERVICE:
  environment:
    - REDIS_TTL_SECONDS=30  # 30 segundos para testing

# Reiniciar servicio
docker-compose -f docker-compose.dev.yml restart fx
```

### 7. Pruebas de Degradación a Tasas por Defecto

**Objetivo:** Verificar fallback a tasas hardcoded

```powershell
# 1. Detener Redis
docker-compose -f docker-compose.dev.yml stop redis

# 2. Hacer conversión en el frontend
# - Si hay caché en memoria del FX service: usará eso
# - Si no hay caché: intentará APIs externas
# - Si APIs fallan: usará tasas por defecto

# 3. Observar logs del FX service
docker-compose -f docker-compose.dev.yml logs fx --tail=50

# Buscar: "Using default rate" o "provider": "default-rates"

# 4. Reiniciar Redis
docker-compose -f docker-compose.dev.yml start redis
```

## 🎨 Indicadores Visuales

### Badges de Proveedor

| Badge | Color | Significado |
|-------|-------|-------------|
| `primary-api` | 🟢 Verde | ExchangeRate-API (primaria) |
| `fallback-api` | 🔵 Azul | FreeCurrency API (secundaria) |
| `default-rates` | 🟡 Amarillo | Tasas hardcoded (degradación total) |

### Badges de Origen

| Badge | Color | Significado |
|-------|-------|-------------|
| `💾 Caché` | 🟣 Morado | Servido desde Redis |
| `🌐 API` | 🟢 Verde | Consulta nueva a API externa |

## 📊 Monitoreo y Logs

### Ver Logs del Gateway

```powershell
docker-compose -f docker-compose.dev.yml logs gateway -f

# Buscar:
# - "Convert request: 100 GTQ → USD"
# - "Convert result: 12.82 USD (rate: 0.128205, provider: primary-api, cache: false)"
```

### Ver Logs del FX Service

```powershell
docker-compose -f docker-compose.dev.yml logs fx -f

# Buscar:
# - "Converting 100 GTQ to USD"
# - "Cache hit for GTQ -> USD"
# - "Trying primary provider"
# - "Trying fallback provider"
# - "[CircuitBreaker] open"
```

### Estadísticas de Redis

```powershell
# Número de keys en Redis
docker exec -it quetzalship-redis redis-cli DBSIZE

# Info de memoria
docker exec -it quetzalship-redis redis-cli INFO memory

# Monitor en tiempo real (ver comandos que llegan a Redis)
docker exec -it quetzalship-redis redis-cli MONITOR
```

## 🔍 Checklist de Validación

### ✅ Funcionalidad Básica

- [ ] Conversión simple funciona (GTQ → USD)
- [ ] Cambio de monedas con botón ⇄
- [ ] Validación de monto (no negativos)
- [ ] Todas las 5 monedas disponibles (GTQ, USD, EUR, GBP, MXN)

### ✅ Caché Redis

- [ ] Primera llamada muestra "🌐 API"
- [ ] Segunda llamada (mismo par) muestra "💾 Caché"
- [ ] TTL funciona (después de 5 min vuelve a API)
- [ ] Keys visibles en Redis con comando `KEYS "*"`

### ✅ Circuit Breaker

- [ ] Logs muestran eventos de circuit breaker
- [ ] Degradación a fallback API cuando primary falla
- [ ] Circuit breaker se cierra después de recuperación

### ✅ Degradación Elegante

- [ ] Con Redis down: intenta APIs externas
- [ ] Con APIs down: usa tasas por defecto
- [ ] Errores muestran mensaje claro en UI

### ✅ Interfaz de Usuario

- [ ] 3 tabs funcionan correctamente
- [ ] Badges de proveedor/caché visibles
- [ ] Tabla de tasas múltiples renderiza bien
- [ ] Timestamps en formato legible (es-GT)
- [ ] Responsive en móvil

### ✅ Gateway REST API

- [ ] `POST /v1/fx/convert` funciona
- [ ] `POST /v1/fx/rate` funciona
- [ ] `POST /v1/fx/rates` funciona
- [ ] Logs muestran requests/responses
- [ ] Manejo de errores retorna 400/500 apropiado

## 🐛 Troubleshooting

### Error: "Cannot connect to FX service"

**Causa:** Gateway no puede conectar con FX service por gRPC

**Solución:**
```powershell
# Verificar que FX service está corriendo
docker-compose -f docker-compose.dev.yml ps fx

# Verificar logs del FX service
docker-compose -f docker-compose.dev.yml logs fx

# Reiniciar FX service
docker-compose -f docker-compose.dev.yml restart fx
```

### Error: "Cannot GET /proto/fx.proto"

**Causa:** Archivo proto no copiado al gateway

**Solución:**
```powershell
# Copiar manualmente
Copy-Item "contracts\proto\fx.proto" -Destination "services\gateway\proto\fx.proto"

# Rebuild gateway
docker-compose -f docker-compose.dev.yml up -d --build gateway
```

### Error: Frontend no muestra componente

**Causa:** Componente no exportado correctamente

**Solución:**
```powershell
# Verificar export en index.ts
Get-Content services\frontend\src\components\index.ts

# Debe contener: export * from './CurrencyConverter';

# Rebuild frontend
cd services\frontend
npm run build
```

### Caché siempre muestra "API"

**Causa:** Redis no está conectado o TTL es 0

**Solución:**
```powershell
# Verificar conexión Redis
docker exec -it quetzalship-redis redis-cli PING
# Debe responder: PONG

# Verificar variable de entorno TTL
docker-compose -f docker-compose.dev.yml config | Select-String "REDIS_TTL"

# Verificar logs de FX service
docker-compose -f docker-compose.dev.yml logs fx | Select-String "cache"
```

## 📝 Próximos Pasos (Opcional)

1. **Métricas Prometheus:**
   - Contador de conversiones
   - Histograma de latencias
   - Gauge de estado del circuit breaker

2. **Tests E2E:**
   - Playwright/Cypress para automatizar pruebas de UI
   - Verificación automática de caché

3. **Dashboards Grafana:**
   - Panel de tasas de cambio en tiempo real
   - Gráficos de uso de APIs (primary vs fallback)
   - Alertas de circuit breaker abierto

4. **Rate Limiting:**
   - Limitar requests por usuario/IP
   - Throttling para APIs externas

## 🎓 Aprendizajes Clave

- ✅ Integración Frontend → Gateway → gRPC Service
- ✅ Visualización de patrones de resiliencia en UI
- ✅ Transformación snake_case ↔ camelCase entre capas
- ✅ Uso de Redis para caché con TTL
- ✅ Circuit breaker con degradación multi-nivel
- ✅ Componentes React con tabs y state management
- ✅ Diseño responsive con CSS Grid/Flexbox

---

**¡Listo para validar el servicio FX! 🚀**

Accede a http://localhost:4200/currency y comienza a probar todas las funcionalidades.
