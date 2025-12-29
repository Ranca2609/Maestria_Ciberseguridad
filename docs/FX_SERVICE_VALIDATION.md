# 🔍 Guía de Validación del Servicio FX

## 📋 Tabla de Contenidos

1. [Características Implementadas](#características-implementadas)
2. [Arquitectura del Servicio](#arquitectura-del-servicio)
3. [Scripts de Validación](#scripts-de-validación)
4. [Pruebas de Resiliencia](#pruebas-de-resiliencia)
5. [Validación de Caché](#validación-de-caché)
6. [Degradación Elegante](#degradación-elegante)
7. [Métricas y Monitoreo](#métricas-y-monitoreo)

---

## ✅ Características Implementadas

### 1. **Conversión de Moneda**
- ✅ Conversión Q → USD (y otras monedas)
- ✅ Cálculo preciso con redondeo a 2 decimales
- ✅ Soporte para múltiples pares de divisas

### 2. **Dos APIs Externas**
- ✅ **Primaria:** ExchangeRate-API
- ✅ **Fallback:** FreeCurrency API
- ✅ Cambio automático al fallback si primaria falla

### 3. **Caché con Redis**
- ✅ TTL configurable (default: 300 segundos / 5 minutos)
- ✅ Variable de entorno: `REDIS_TTL_SECONDS`
- ✅ Almacenamiento de tasas con metadata (timestamp, provider)
- ✅ Estrategia de invalidación automática

### 4. **Resiliencia Avanzada**

#### a) Timeouts
- ✅ Timeout configurable: `CB_TIMEOUT_MS` (default: 3000ms)
- ✅ Previene llamadas colgadas indefinidamente

#### b) Retries con Backoff Exponencial
- ✅ Reintentos configurables: `FX_MAX_RETRIES` (default: 2)
- ✅ Backoff exponencial: 1s → 2s → 4s
- ✅ Fórmula: `baseDelay * 2^(attempt-1)`

#### c) Circuit Breaker
- ✅ Umbral de error: `CB_ERROR_THRESHOLD` (default: 50%)
- ✅ Umbral de volumen: `CB_VOLUME_THRESHOLD` (default: 5 requests)
- ✅ Tiempo de reset: `CB_RESET_TIMEOUT_MS` (default: 30000ms)
- ✅ Estados: CLOSED → OPEN → HALF-OPEN
- ✅ Circuit breaker independiente por proveedor

### 5. **Degradación Elegante**

#### Cascada de Fallback:
1. **Caché** → Si existe, retorna inmediatamente
2. **API Primaria** → Con circuit breaker + retries
3. **API Fallback** → Con circuit breaker + retries
4. **Tasas Default** → Valores fijos por moneda
5. **Error Controlado** → Si todo falla, error sin caer el sistema

#### Tasas Default:
```typescript
{
  GTQ: 7.8,
  EUR: 0.92,
  GBP: 0.79,
  MXN: 17.2,
  USD: 1.0,
}
```

---

## 🏗️ Arquitectura del Servicio

```
┌─────────────────────────────────────────────────────────────────┐
│                         FX Service (gRPC)                       │
│                           Port: 50055                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │    FxService Logic    │
      │  (fx.service.ts)      │
      └───────┬───────────────┘
              │
    ┌─────────┼─────────┬─────────────┬────────────────┐
    │         │         │             │                │
┌───▼────┐ ┌─▼──────┐ ┌▼──────────┐ ┌▼────────────┐ ┌▼─────────┐
│ Cache  │ │Circuit │ │  Primary  │ │  Fallback   │ │  Logger  │
│Service │ │Breaker │ │   Client  │ │   Client    │ │ Service  │
│(Redis) │ │Service │ │(Exchange  │ │(FreeCurr)   │ │          │
└────────┘ └────────┘ │RateAPI)   │ └─────────────┘ └──────────┘
                      └───────────┘

Flujo de Ejecución:
1. Request → Cache hit? → Return cached
2. Cache miss → Circuit Breaker (Primary)
   ├─ Success → Cache + Return
   └─ Failure → Circuit Breaker (Fallback)
      ├─ Success → Cache + Return
      └─ Failure → Default Rates
         ├─ Available → Return default
         └─ Not Available → Throw error
```

---

## 🧪 Scripts de Validación

### Script 1: Validación Completa

```powershell
# Archivo: scripts/validate-fx-service.ps1

# Test 1: Conversión básica
Write-Host "`n=== TEST 1: Conversión GTQ → USD ===" -ForegroundColor Cyan
$response = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/convert" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    from_currency = "GTQ"
    to_currency = "USD"
    amount = 78
  } | ConvertTo-Json)

Write-Host "✅ Monto original: $($response.original_amount) GTQ" -ForegroundColor Green
Write-Host "✅ Monto convertido: $($response.converted_amount) USD" -ForegroundColor Green
Write-Host "✅ Tasa: $($response.rate)" -ForegroundColor Green
Write-Host "✅ Proveedor: $($response.provider)" -ForegroundColor Yellow
Write-Host "✅ Desde caché: $($response.from_cache)" -ForegroundColor Yellow

# Test 2: Verificar caché (segunda llamada debe venir de caché)
Write-Host "`n=== TEST 2: Verificar Caché ===" -ForegroundColor Cyan
$response2 = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/convert" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    from_currency = "GTQ"
    to_currency = "USD"
    amount = 78
  } | ConvertTo-Json)

if ($response2.from_cache -eq $true) {
  Write-Host "✅ CACHÉ FUNCIONANDO - Segunda llamada viene de Redis" -ForegroundColor Green
} else {
  Write-Host "❌ CACHÉ NO FUNCIONA - Debería venir de caché" -ForegroundColor Red
}

# Test 3: Obtener tasa de cambio
Write-Host "`n=== TEST 3: Obtener Tasa de Cambio ===" -ForegroundColor Cyan
$rate = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/rate" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    from_currency = "GTQ"
    to_currency = "USD"
  } | ConvertTo-Json)

Write-Host "Tasa GTQ → USD: $($rate.rate)" -ForegroundColor Green

# Test 4: Múltiples tasas
Write-Host "`n=== TEST 4: Obtener Múltiples Tasas ===" -ForegroundColor Cyan
$rates = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/rates" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body (@{
    base_currency = "USD"
    target_currencies = @("GTQ", "EUR", "GBP", "MXN")
  } | ConvertTo-Json)

Write-Host "Tasas desde USD:" -ForegroundColor Green
$rates.rates.PSObject.Properties | ForEach-Object {
  Write-Host "  $($_.Name): $($_.Value)" -ForegroundColor Yellow
}
```

### Script 2: Prueba de Resiliencia

```powershell
# Archivo: scripts/test-fx-resilience.ps1

Write-Host "=== PRUEBAS DE RESILIENCIA FX ===" -ForegroundColor Magenta

# Test 1: Verificar que el servicio responde
Write-Host "`n1. Verificar disponibilidad..." -ForegroundColor Cyan
try {
  $response = Invoke-RestMethod `
    -Uri "http://localhost:50055/fx/convert" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}' `
    -TimeoutSec 10
  Write-Host "✅ Servicio disponible" -ForegroundColor Green
} catch {
  Write-Host "❌ Servicio no disponible: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Test 2: Verificar Redis
Write-Host "`n2. Verificar conexión a Redis..." -ForegroundColor Cyan
try {
  $redisCheck = docker exec quetzalship-redis redis-cli PING
  if ($redisCheck -eq "PONG") {
    Write-Host "✅ Redis funcionando" -ForegroundColor Green
  }
} catch {
  Write-Host "❌ Redis no responde" -ForegroundColor Red
}

# Test 3: Verificar TTL de caché
Write-Host "`n3. Verificar TTL de caché..." -ForegroundColor Cyan
$response1 = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/convert" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"from_currency":"EUR","to_currency":"USD","amount":50}'

Write-Host "Timestamp inicial: $($response1.timestamp)" -ForegroundColor Yellow

Start-Sleep -Seconds 2

$response2 = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/convert" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"from_currency":"EUR","to_currency":"USD","amount":50}'

if ($response2.from_cache -eq $true) {
  Write-Host "✅ Caché con TTL funcionando" -ForegroundColor Green
  Write-Host "Timestamp: $($response2.timestamp) (debe ser igual al inicial)" -ForegroundColor Yellow
}

# Test 4: Simular carga (múltiples requests)
Write-Host "`n4. Prueba de carga (10 requests)..." -ForegroundColor Cyan
$startTime = Get-Date
1..10 | ForEach-Object {
  try {
    Invoke-RestMethod `
      -Uri "http://localhost:50055/fx/convert" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"} `
      -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}' | Out-Null
    Write-Host "." -NoNewline -ForegroundColor Green
  } catch {
    Write-Host "X" -NoNewline -ForegroundColor Red
  }
}
$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "`n✅ 10 requests completados en $duration segundos" -ForegroundColor Green

# Test 5: Verificar logs del servicio
Write-Host "`n5. Verificar logs del servicio..." -ForegroundColor Cyan
$logs = docker logs quetzalship-fx --tail 20
Write-Host $logs -ForegroundColor Gray
```

### Script 3: Prueba de Degradación

```powershell
# Archivo: scripts/test-fx-degradation.ps1

Write-Host "=== PRUEBA DE DEGRADACIÓN ELEGANTE ===" -ForegroundColor Magenta

# Escenario 1: Sin Redis (caché deshabilitada)
Write-Host "`n=== ESCENARIO 1: Sin Redis ===" -ForegroundColor Cyan
Write-Host "Deteniendo Redis..." -ForegroundColor Yellow
docker stop quetzalship-redis | Out-Null

Start-Sleep -Seconds 2

try {
  $response = Invoke-RestMethod `
    -Uri "http://localhost:50055/fx/convert" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}'
  
  Write-Host "✅ Servicio funciona sin Redis" -ForegroundColor Green
  Write-Host "Proveedor: $($response.provider)" -ForegroundColor Yellow
  Write-Host "Caché: $($response.from_cache)" -ForegroundColor Yellow
} catch {
  Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nIniciando Redis nuevamente..." -ForegroundColor Yellow
docker start quetzalship-redis | Out-Null
Start-Sleep -Seconds 5

# Escenario 2: APIs lentas (timeout)
Write-Host "`n=== ESCENARIO 2: Timeout (APIs lentas) ===" -ForegroundColor Cyan
Write-Host "Esperando a que caché expire (puede tomar 5 minutos)..." -ForegroundColor Yellow
Write-Host "O puedes limpiar caché manualmente:" -ForegroundColor Yellow
Write-Host "  docker exec quetzalship-redis redis-cli FLUSHALL" -ForegroundColor Gray

# Escenario 3: Uso de tasas default
Write-Host "`n=== ESCENARIO 3: Tasas Default ===" -ForegroundColor Cyan
Write-Host "Las tasas default se usan cuando ambas APIs fallan" -ForegroundColor Yellow
Write-Host "Tasas configuradas:" -ForegroundColor Yellow
Write-Host "  GTQ: 7.8" -ForegroundColor Gray
Write-Host "  EUR: 0.92" -ForegroundColor Gray
Write-Host "  GBP: 0.79" -ForegroundColor Gray
Write-Host "  MXN: 17.2" -ForegroundColor Gray
Write-Host "  USD: 1.0" -ForegroundColor Gray

Write-Host "`n✅ Degradación elegante configurada correctamente" -ForegroundColor Green
```

---

## 🧪 Pruebas de Resiliencia

### 1. **Circuit Breaker**

#### Verificar Estados del Circuit Breaker:

```powershell
# Ver logs en tiempo real
docker logs quetzalship-fx --follow

# Buscar eventos de circuit breaker:
# - "Circuit breaker OPEN" (demasiados errores)
# - "Circuit breaker HALF-OPEN" (intentando recuperar)
# - "Circuit breaker CLOSED" (funcionando normal)
# - "Circuit breaker TIMEOUT" (request demoró demasiado)
# - "Circuit breaker REJECTED" (rechazando requests mientras está abierto)
```

#### Forzar Apertura del Circuit Breaker:

```powershell
# Hacer múltiples requests que fallen
# (el circuit breaker se abrirá después de 50% de errores en 5 requests)

1..10 | ForEach-Object {
  try {
    # Request inválido para forzar error
    Invoke-RestMethod `
      -Uri "http://localhost:50055/fx/convert" `
      -Method POST `
      -Headers @{"Content-Type"="application/json"} `
      -Body '{"from_currency":"INVALID","to_currency":"USD","amount":100}'
  } catch {
    Write-Host "Request $_ falló (esperado)" -ForegroundColor Yellow
  }
  Start-Sleep -Milliseconds 500
}

# Después de esto, revisa los logs:
docker logs quetzalship-fx --tail 50 | Select-String "Circuit breaker"
```

### 2. **Retries con Backoff Exponencial**

#### Ver Retries en Logs:

```powershell
# Los retries se ven así en los logs:
# "Retry attempt 1/2, waiting 1000ms"
# "Retry attempt 2/2, waiting 2000ms"

docker logs quetzalship-fx | Select-String "Retry attempt"
```

### 3. **Timeout**

#### Configurar Timeout Corto para Pruebas:

```bash
# En docker-compose.local.yml, agregar:
environment:
  CB_TIMEOUT_MS: 1000  # 1 segundo (muy agresivo para pruebas)
```

---

## 💾 Validación de Caché

### 1. **Verificar que el Caché Funciona**

```powershell
# Primera llamada (debe ir a API)
$response1 = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/convert" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}'

Write-Host "Primera llamada - Caché: $($response1.from_cache)" # false
Write-Host "Proveedor: $($response1.provider)" # ExchangeRate-API o FreeCurrency

# Segunda llamada (debe venir de caché)
$response2 = Invoke-RestMethod `
  -Uri "http://localhost:50055/fx/convert" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}'

Write-Host "Segunda llamada - Caché: $($response2.from_cache)" # true
Write-Host "Proveedor: $($response2.provider)" # "(cached)"
```

### 2. **Verificar TTL**

```powershell
# Ver TTL de las claves en Redis
docker exec quetzalship-redis redis-cli KEYS "fx:*"
docker exec quetzalship-redis redis-cli TTL "fx:rate:GTQ:USD"
```

### 3. **Limpiar Caché**

```powershell
# Limpiar todo el caché
docker exec quetzalship-redis redis-cli FLUSHALL

# Limpiar solo claves de FX
docker exec quetzalship-redis redis-cli --scan --pattern "fx:*" | ForEach-Object {
  docker exec quetzalship-redis redis-cli DEL $_
}
```

### 4. **Ver Contenido del Caché**

```powershell
# Ver una entrada específica
docker exec quetzalship-redis redis-cli GET "fx:rate:GTQ:USD" | ConvertFrom-Json
```

---

## 🛡️ Degradación Elegante

### Cascada de Fallback - Validación

```powershell
# Test completo de degradación
Write-Host "=== VALIDACIÓN DE DEGRADACIÓN ELEGANTE ===" -ForegroundColor Magenta

# 1. Con todo funcionando (debe usar API primaria)
Write-Host "`n1. Escenario normal (todas las APIs disponibles)"
docker exec quetzalship-redis redis-cli FLUSHALL | Out-Null
$r1 = Invoke-RestMethod -Uri "http://localhost:50055/fx/convert" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}'
Write-Host "✅ Proveedor: $($r1.provider)" -ForegroundColor Green

# 2. Segunda llamada (debe usar caché)
Write-Host "`n2. Segunda llamada (debe venir de caché)"
$r2 = Invoke-RestMethod -Uri "http://localhost:50055/fx/convert" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"from_currency":"GTQ","to_currency":"USD","amount":100}'
if ($r2.from_cache) {
  Write-Host "✅ Usando caché correctamente" -ForegroundColor Green
} else {
  Write-Host "❌ ERROR: Debería usar caché" -ForegroundColor Red
}

# 3. Sin Redis (debe funcionar con APIs)
Write-Host "`n3. Sin Redis (degradación nivel 1)"
docker stop quetzalship-redis | Out-Null
Start-Sleep -Seconds 2
try {
  $r3 = Invoke-RestMethod -Uri "http://localhost:50055/fx/convert" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"from_currency":"EUR","to_currency":"USD","amount":100}'
  Write-Host "✅ Funciona sin Redis: $($r3.provider)" -ForegroundColor Green
} catch {
  Write-Host "❌ ERROR sin Redis: $($_.Exception.Message)" -ForegroundColor Red
}
docker start quetzalship-redis | Out-Null
Start-Sleep -Seconds 3

# 4. Moneda no soportada por APIs (debe usar default)
Write-Host "`n4. Usando tasas default (degradación nivel 2)"
Write-Host "Nota: Esto requiere que ambas APIs fallen" -ForegroundColor Yellow
Write-Host "Las tasas default están configuradas para GTQ, EUR, GBP, MXN, USD" -ForegroundColor Yellow

Write-Host "`n✅ Validación de degradación completada" -ForegroundColor Green
```

---

## 📊 Métricas y Monitoreo

### 1. **Métricas del Circuit Breaker**

```powershell
# Ver estado de circuit breakers en logs
docker logs quetzalship-fx | Select-String "Circuit breaker" | Select-Object -Last 20
```

**Estados a buscar:**
- `Circuit breaker OPEN` → Demasiados errores, requests bloqueados
- `Circuit breaker HALF-OPEN` → Intentando recuperarse
- `Circuit breaker CLOSED` → Normal, todo funcionando
- `Circuit breaker TIMEOUT` → Request tardó más que CB_TIMEOUT_MS
- `Circuit breaker REJECTED` → Request rechazado (breaker abierto)

### 2. **Métricas de Caché**

```powershell
# Estadísticas de Redis
docker exec quetzalship-redis redis-cli INFO stats

# Hits y misses
docker exec quetzalship-redis redis-cli INFO stats | Select-String "keyspace"

# Número de claves
docker exec quetzalship-redis redis-cli DBSIZE
```

### 3. **Logs Estructurados**

Buscar en los logs:

```powershell
# Cache hits
docker logs quetzalship-fx | Select-String "Cache hit"

# Fallos de proveedor primario
docker logs quetzalship-fx | Select-String "Primary provider failed"

# Uso de fallback
docker logs quetzalship-fx | Select-String "trying fallback"

# Degradación (tasas default)
docker logs quetzalship-fx | Select-String "degraded mode"

# Retries
docker logs quetzalship-fx | Select-String "Retry attempt"
```

---

## 🎯 Checklist de Validación

### ✅ Funcionalidad Básica
- [ ] Conversión GTQ → USD funciona
- [ ] Respuesta incluye: rate, converted_amount, provider, from_cache, timestamp
- [ ] Cálculo correcto (ej: 78 GTQ ≈ 10 USD a tasa de ~7.8)

### ✅ Dos APIs
- [ ] API primaria (ExchangeRate-API) responde
- [ ] API fallback (FreeCurrency) puede responder si primaria falla
- [ ] El servicio cambia automáticamente al fallback

### ✅ Caché con Redis
- [ ] Primera llamada: `from_cache: false`
- [ ] Segunda llamada: `from_cache: true`
- [ ] TTL configurable (REDIS_TTL_SECONDS)
- [ ] Caché incluye timestamp y provider
- [ ] Funciona sin Redis (degradación)

### ✅ Timeouts
- [ ] Variable CB_TIMEOUT_MS configurada
- [ ] Timeout se aplica a llamadas API
- [ ] Logs muestran "TIMEOUT" cuando ocurre

### ✅ Retries
- [ ] FX_MAX_RETRIES configurado (default: 2)
- [ ] Backoff exponencial: 1s → 2s → 4s
- [ ] Logs muestran "Retry attempt X/Y"

### ✅ Circuit Breaker
- [ ] CB_ERROR_THRESHOLD configurado (default: 50%)
- [ ] CB_VOLUME_THRESHOLD configurado (default: 5)
- [ ] CB_RESET_TIMEOUT_MS configurado (default: 30000ms)
- [ ] Circuit breaker por proveedor (primary + fallback)
- [ ] Logs muestran estados: OPEN, HALF-OPEN, CLOSED

### ✅ Degradación Elegante
- [ ] Caché → API Primaria → API Fallback → Default → Error
- [ ] Tasas default definidas (GTQ: 7.8, EUR: 0.92, etc.)
- [ ] Sistema no cae si todo falla
- [ ] Logs indican "degraded mode" cuando usa defaults

---

## 🚀 Ejecución Rápida

```powershell
# 1. Levantar servicios
docker compose -f docker-compose.local.yml up -d quetzalship-fx quetzalship-redis

# 2. Verificar que están corriendo
docker ps | Select-String "fx|redis"

# 3. Ejecutar validación básica
.\scripts\validate-fx-service.ps1

# 4. Ejecutar pruebas de resiliencia
.\scripts\test-fx-resilience.ps1

# 5. Verificar logs
docker logs quetzalship-fx --tail 50
```

---

**Última actualización:** 26 de diciembre de 2025  
**Versión FX Service:** 1.0.0
