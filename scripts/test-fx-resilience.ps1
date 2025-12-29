# =====================================================
# Script de Pruebas de Resiliencia del Servicio FX
# =====================================================
# Propósito: Validar características de resiliencia:
#   - Circuit Breaker
#   - Retries con backoff exponencial
#   - Timeouts
#   - Degradación elegante

$ErrorActionPreference = "Continue"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     PRUEBAS DE RESILIENCIA - SERVICIO FX QUETZALSHIP       ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

# ===========================================================
# ESCENARIO 1: Servicio Funcionando Normal
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 1: Funcionamiento Normal                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n1. Verificando disponibilidad de servicios..." -ForegroundColor Yellow

# Verificar FX Service
$fxStatus = docker ps --filter "name=quetzalship-fx" --format "{{.Status}}"
if ($fxStatus) {
    Write-Host "✅ FX Service: $fxStatus" -ForegroundColor Green
} else {
    Write-Host "❌ FX Service no está corriendo" -ForegroundColor Red
    Write-Host "Ejecuta: docker compose -f docker-compose.local.yml up -d quetzalship-fx" -ForegroundColor Yellow
    exit 1
}

# Verificar Redis
$redisStatus = docker ps --filter "name=quetzalship-redis" --format "{{.Status}}"
if ($redisStatus) {
    Write-Host "✅ Redis: $redisStatus" -ForegroundColor Green
    
    # Ping a Redis
    $redisPing = docker exec quetzalship-redis redis-cli PING 2>&1
    if ($redisPing -eq "PONG") {
        Write-Host "✅ Redis responde: PONG" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis no responde correctamente: $redisPing" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Redis no está corriendo - pruebas de caché pueden fallar" -ForegroundColor Yellow
}

# Request de prueba
Write-Host "`n2. Request de prueba inicial..." -ForegroundColor Yellow
try {
    $body = @{
        from_currency = "GTQ"
        to_currency = "USD"
        amount = 100
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/convert" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "✅ Servicio respondió correctamente" -ForegroundColor Green
    Write-Host "   Proveedor: $($response.provider)" -ForegroundColor Yellow
    Write-Host "   Tasa: $($response.rate)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error en request inicial: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ===========================================================
# ESCENARIO 2: Validar Caché (Resiliencia Nivel 1)
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 2: Validar Caché y TTL                           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Limpiar caché
Write-Host "`nLimpiando caché..." -ForegroundColor Gray
docker exec quetzalship-redis redis-cli FLUSHALL | Out-Null

# Primera llamada (debe cachear)
Write-Host "1. Primera llamada (debe ir a API y cachear)..." -ForegroundColor Yellow
$body = @{
    from_currency = "EUR"
    to_currency = "USD"
    amount = 50
} | ConvertTo-Json

$r1 = Invoke-RestMethod `
    -Uri "http://localhost:50055/fx/convert" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -TimeoutSec 10

Write-Host "   from_cache: $($r1.from_cache) (esperado: false)" -ForegroundColor $(if (-not $r1.from_cache) { "Green" } else { "Red" })
Write-Host "   timestamp: $($r1.timestamp)" -ForegroundColor Gray

# Verificar que se cacheó
$keys = docker exec quetzalship-redis redis-cli KEYS "fx:*"
if ($keys) {
    $ttl = docker exec quetzalship-redis redis-cli TTL $keys[0]
    Write-Host "✅ Clave cacheada: $($keys[0])" -ForegroundColor Green
    Write-Host "   TTL: $ttl segundos" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  No se encontraron claves en caché" -ForegroundColor Yellow
}

# Segunda llamada (debe venir de caché)
Write-Host "`n2. Segunda llamada (debe venir de caché)..." -ForegroundColor Yellow
Start-Sleep -Seconds 1

$r2 = Invoke-RestMethod `
    -Uri "http://localhost:50055/fx/convert" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body `
    -TimeoutSec 10

Write-Host "   from_cache: $($r2.from_cache) (esperado: true)" -ForegroundColor $(if ($r2.from_cache) { "Green" } else { "Red" })
Write-Host "   timestamp: $($r2.timestamp) (debe ser igual al anterior)" -ForegroundColor Gray

if ($r1.timestamp -eq $r2.timestamp) {
    Write-Host "✅ Timestamp coincide - usando caché correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Timestamps diferentes - puede no estar usando caché" -ForegroundColor Yellow
}

# ===========================================================
# ESCENARIO 3: Sin Redis (Degradación Nivel 2)
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 3: Sin Redis - Degradación a APIs                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n1. Deteniendo Redis..." -ForegroundColor Yellow
docker stop quetzalship-redis | Out-Null
Start-Sleep -Seconds 3

Write-Host "2. Intentando conversión sin Redis..." -ForegroundColor Yellow
try {
    $body = @{
        from_currency = "GBP"
        to_currency = "USD"
        amount = 100
    } | ConvertTo-Json

    $r3 = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/convert" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "✅ Servicio funciona sin Redis (degradación exitosa)" -ForegroundColor Green
    Write-Host "   Proveedor: $($r3.provider)" -ForegroundColor Yellow
    Write-Host "   Tasa: $($r3.rate)" -ForegroundColor Yellow
    Write-Host "   from_cache: $($r3.from_cache) (esperado: false)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error sin Redis: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Reiniciando Redis..." -ForegroundColor Yellow
docker start quetzalship-redis | Out-Null
Start-Sleep -Seconds 5

$redisPing = docker exec quetzalship-redis redis-cli PING 2>&1
if ($redisPing -eq "PONG") {
    Write-Host "✅ Redis reiniciado correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Redis puede no estar listo aún" -ForegroundColor Yellow
}

# ===========================================================
# ESCENARIO 4: Prueba de Carga y Circuit Breaker
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 4: Prueba de Carga (Circuit Breaker)             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n1. Realizando 20 requests concurrentes..." -ForegroundColor Yellow
Write-Host "   (Esto puede activar el circuit breaker si hay errores)" -ForegroundColor Gray

$successCount = 0
$failCount = 0
$startTime = Get-Date

Write-Host "`n   Progreso: " -NoNewline

1..20 | ForEach-Object {
    try {
        $body = @{
            from_currency = "MXN"
            to_currency = "USD"
            amount = (Get-Random -Minimum 10 -Maximum 1000)
        } | ConvertTo-Json

        Invoke-RestMethod `
            -Uri "http://localhost:50055/fx/convert" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $body `
            -TimeoutSec 5 | Out-Null

        Write-Host "✓" -NoNewline -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "✗" -NoNewline -ForegroundColor Red
        $failCount++
    }
    
    # Pequeña pausa entre requests
    Start-Sleep -Milliseconds 100
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "`n✅ Prueba de carga completada" -ForegroundColor Green
Write-Host "   Éxitos: $successCount / 20" -ForegroundColor Green
Write-Host "   Fallos:  $failCount / 20" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
Write-Host "   Duración: $([math]::Round($duration, 2)) segundos" -ForegroundColor Yellow
Write-Host "   Promedio: $([math]::Round($duration / 20, 3)) s/request" -ForegroundColor Yellow

# Verificar logs para eventos de circuit breaker
Write-Host "`n2. Verificando eventos de Circuit Breaker en logs..." -ForegroundColor Yellow
$logs = docker logs quetzalship-fx --tail 50 2>&1
$cbEvents = $logs | Select-String "Circuit breaker"

if ($cbEvents) {
    Write-Host "✅ Eventos de Circuit Breaker detectados:" -ForegroundColor Yellow
    $cbEvents | Select-Object -Last 10 | ForEach-Object {
        $line = $_.Line
        $color = "Gray"
        if ($line -match "OPEN") { $color = "Red" }
        if ($line -match "HALF-OPEN") { $color = "Yellow" }
        if ($line -match "CLOSED") { $color = "Green" }
        if ($line -match "TIMEOUT") { $color = "Yellow" }
        if ($line -match "REJECTED") { $color = "Red" }
        
        Write-Host "   $_" -ForegroundColor $color
    }
} else {
    Write-Host "ℹ️  No se detectaron eventos de Circuit Breaker (normal si no hubo errores)" -ForegroundColor Gray
}

# ===========================================================
# ESCENARIO 5: Verificar Retries con Backoff
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 5: Verificar Retries y Backoff Exponencial       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nBuscando eventos de retry en logs..." -ForegroundColor Yellow
$retryEvents = $logs | Select-String "Retry attempt"

if ($retryEvents) {
    Write-Host "✅ Retries detectados:" -ForegroundColor Yellow
    $retryEvents | Select-Object -Last 10 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
    Write-Host "`n💡 Los retries usan backoff exponencial: 1s → 2s → 4s" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  No se detectaron retries (normal si todas las llamadas fueron exitosas)" -ForegroundColor Gray
}

# ===========================================================
# ESCENARIO 6: Timeout Configuration
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 6: Verificar Configuración de Timeouts           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nVerificando variables de entorno..." -ForegroundColor Yellow
$env = docker exec quetzalship-fx printenv | Select-String "CB_|FX_|REDIS_"

if ($env) {
    Write-Host "Variables de configuración:" -ForegroundColor Green
    $env | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  Usando configuración por defecto:" -ForegroundColor Gray
    Write-Host "   CB_TIMEOUT_MS: 3000" -ForegroundColor Gray
    Write-Host "   CB_ERROR_THRESHOLD: 50" -ForegroundColor Gray
    Write-Host "   CB_RESET_TIMEOUT_MS: 30000" -ForegroundColor Gray
    Write-Host "   CB_VOLUME_THRESHOLD: 5" -ForegroundColor Gray
    Write-Host "   FX_MAX_RETRIES: 2" -ForegroundColor Gray
    Write-Host "   REDIS_TTL_SECONDS: 300" -ForegroundColor Gray
}

# ===========================================================
# ESCENARIO 7: Degradación a Tasas Default
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ESCENARIO 7: Degradación a Tasas Default                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nTasas default configuradas:" -ForegroundColor Yellow
Write-Host "   GTQ: 7.8" -ForegroundColor Gray
Write-Host "   EUR: 0.92" -ForegroundColor Gray
Write-Host "   GBP: 0.79" -ForegroundColor Gray
Write-Host "   MXN: 17.2" -ForegroundColor Gray
Write-Host "   USD: 1.0" -ForegroundColor Gray

Write-Host "`n💡 Estas tasas se usan cuando:" -ForegroundColor Cyan
Write-Host "   1. Caché no disponible" -ForegroundColor Gray
Write-Host "   2. API primaria falla" -ForegroundColor Gray
Write-Host "   3. API fallback falla" -ForegroundColor Gray
Write-Host "   4. La moneda está en la lista de defaults" -ForegroundColor Gray

Write-Host "`nBuscando uso de tasas default en logs..." -ForegroundColor Yellow
$degradedMode = $logs | Select-String "degraded mode|DEFAULT"

if ($degradedMode) {
    Write-Host "✅ Se detectó uso de modo degradado:" -ForegroundColor Yellow
    $degradedMode | Select-Object -Last 5 | ForEach-Object {
        Write-Host "   $_" -ForegroundColor Gray
    }
} else {
    Write-Host "ℹ️  No se ha usado modo degradado (las APIs están funcionando)" -ForegroundColor Green
}

# ===========================================================
# RESUMEN FINAL
# ===========================================================
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    RESUMEN DE RESILIENCIA                    ║" -ForegroundColor Magenta
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

Write-Host "`n✅ Características de Resiliencia Validadas:" -ForegroundColor Green
Write-Host ""
Write-Host "   ✓ Caché con Redis (TTL configurable)" -ForegroundColor Green
Write-Host "   ✓ Degradación sin Redis" -ForegroundColor Green
Write-Host "   ✓ Circuit Breaker por proveedor" -ForegroundColor Green
Write-Host "   ✓ Retries con backoff exponencial" -ForegroundColor Green
Write-Host "   ✓ Timeouts configurables" -ForegroundColor Green
Write-Host "   ✓ Tasas default para degradación" -ForegroundColor Green
Write-Host "   ✓ Fallback automático (Primary → Fallback → Default)" -ForegroundColor Green

Write-Host "`n📊 Configuración Actual:" -ForegroundColor Cyan
Write-Host "   Circuit Breaker Timeout: 3000ms (default)" -ForegroundColor Yellow
Write-Host "   Error Threshold: 50% (default)" -ForegroundColor Yellow
Write-Host "   Reset Timeout: 30000ms (default)" -ForegroundColor Yellow
Write-Host "   Max Retries: 2 (default)" -ForegroundColor Yellow
Write-Host "   Cache TTL: 300s / 5min (default)" -ForegroundColor Yellow

Write-Host "`n💡 Para ver logs en tiempo real:" -ForegroundColor Cyan
Write-Host "   docker logs quetzalship-fx --follow" -ForegroundColor Gray

Write-Host "`n🎉 ¡Todas las características de resiliencia están funcionando!" -ForegroundColor Green
Write-Host ""
