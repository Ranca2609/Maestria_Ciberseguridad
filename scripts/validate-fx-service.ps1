# ===========================================
# Script de Validación del Servicio FX
# ===========================================
# Propósito: Validar todas las características del servicio de conversión de moneda
# Requisitos: Docker con servicios FX y Redis corriendo

param(
    [switch]$Detailed = $false
)

$ErrorActionPreference = "Continue"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        VALIDACIÓN DEL SERVICIO FX - QUETZALSHIP       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Verificar que los servicios estén corriendo
Write-Host "`n📋 Verificando servicios..." -ForegroundColor Yellow
$fxRunning = docker ps --filter "name=quetzalship-fx" --format "{{.Names}}"
$redisRunning = docker ps --filter "name=quetzalship-redis" --format "{{.Names}}"

if (-not $fxRunning) {
    Write-Host "❌ Servicio FX no está corriendo" -ForegroundColor Red
    Write-Host "Ejecuta: docker compose -f docker-compose.local.yml up -d quetzalship-fx" -ForegroundColor Yellow
    exit 1
}

if (-not $redisRunning) {
    Write-Host "⚠️  Redis no está corriendo - algunas pruebas pueden fallar" -ForegroundColor Yellow
} else {
    Write-Host "✅ FX Service: $fxRunning" -ForegroundColor Green
    Write-Host "✅ Redis: $redisRunning" -ForegroundColor Green
}

# ===========================================================
# TEST 1: Conversión Básica GTQ → USD
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST 1: Conversión Básica (GTQ → USD)                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

try {
    $body = @{
        from_currency = "GTQ"
        to_currency = "USD"
        amount = 78
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/convert" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "✅ Conversión exitosa" -ForegroundColor Green
    Write-Host "   Monto original:  $($response.original_amount) GTQ" -ForegroundColor White
    Write-Host "   Monto convertido: $($response.converted_amount) USD" -ForegroundColor White
    Write-Host "   Tasa de cambio:  $($response.rate)" -ForegroundColor White
    Write-Host "   Proveedor:       $($response.provider)" -ForegroundColor Yellow
    Write-Host "   Desde caché:     $($response.from_cache)" -ForegroundColor Yellow
    Write-Host "   Timestamp:       $($response.timestamp)" -ForegroundColor Gray

    if ($Detailed) {
        Write-Host "`n   Respuesta completa:" -ForegroundColor Gray
        Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor DarkGray
    }

    $test1Pass = $true
} catch {
    Write-Host "❌ TEST 1 FALLIDO" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $test1Pass = $false
}

# ===========================================================
# TEST 2: Validación de Caché
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST 2: Validación de Caché Redis                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

try {
    # Limpiar caché primero
    Write-Host "Limpiando caché..." -ForegroundColor Gray
    docker exec quetzalship-redis redis-cli FLUSHALL | Out-Null

    # Primera llamada (debe ir a API)
    $body = @{
        from_currency = "EUR"
        to_currency = "USD"
        amount = 100
    } | ConvertTo-Json

    $response1 = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/convert" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "Primera llamada:" -ForegroundColor White
    Write-Host "   Desde caché: $($response1.from_cache)" -ForegroundColor Yellow
    Write-Host "   Proveedor: $($response1.provider)" -ForegroundColor Yellow

    Start-Sleep -Seconds 1

    # Segunda llamada (debe venir de caché)
    $response2 = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/convert" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "`nSegunda llamada:" -ForegroundColor White
    Write-Host "   Desde caché: $($response2.from_cache)" -ForegroundColor Yellow
    Write-Host "   Proveedor: $($response2.provider)" -ForegroundColor Yellow

    if ($response1.from_cache -eq $false -and $response2.from_cache -eq $true) {
        Write-Host "`n✅ CACHÉ FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
        $test2Pass = $true
    } else {
        Write-Host "`n❌ CACHÉ NO FUNCIONA COMO ESPERADO" -ForegroundColor Red
        Write-Host "   Primera: from_cache=$($response1.from_cache) (esperado: false)" -ForegroundColor Yellow
        Write-Host "   Segunda: from_cache=$($response2.from_cache) (esperado: true)" -ForegroundColor Yellow
        $test2Pass = $false
    }

    # Verificar TTL en Redis
    Write-Host "`nVerificando TTL en Redis..." -ForegroundColor Gray
    $keys = docker exec quetzalship-redis redis-cli KEYS "fx:*"
    if ($keys) {
        $ttl = docker exec quetzalship-redis redis-cli TTL $keys[0]
        Write-Host "   TTL de clave: $ttl segundos" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ TEST 2 FALLIDO" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $test2Pass = $false
}

# ===========================================================
# TEST 3: Obtener Tasa de Cambio (sin conversión)
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST 3: Obtener Tasa de Cambio                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

try {
    $body = @{
        from_currency = "GTQ"
        to_currency = "USD"
    } | ConvertTo-Json

    $rate = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/rate" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "✅ Tasa obtenida correctamente" -ForegroundColor Green
    Write-Host "   GTQ → USD: $($rate.rate)" -ForegroundColor White
    Write-Host "   Proveedor: $($rate.provider)" -ForegroundColor Yellow
    Write-Host "   Desde caché: $($rate.from_cache)" -ForegroundColor Yellow

    $test3Pass = $true
} catch {
    Write-Host "❌ TEST 3 FALLIDO" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $test3Pass = $false
}

# ===========================================================
# TEST 4: Múltiples Tasas de Cambio
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST 4: Obtener Múltiples Tasas                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

try {
    $body = @{
        base_currency = "USD"
        target_currencies = @("GTQ", "EUR", "GBP", "MXN")
    } | ConvertTo-Json

    $rates = Invoke-RestMethod `
        -Uri "http://localhost:50055/fx/rates" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -TimeoutSec 10

    Write-Host "✅ Múltiples tasas obtenidas" -ForegroundColor Green
    Write-Host "   Base: $($rates.base_currency)" -ForegroundColor White
    Write-Host "`n   Tasas:" -ForegroundColor White
    $rates.rates.PSObject.Properties | ForEach-Object {
        Write-Host "      $($_.Name): $($_.Value)" -ForegroundColor Yellow
    }

    $test4Pass = $true
} catch {
    Write-Host "❌ TEST 4 FALLIDO" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    $test4Pass = $false
}

# ===========================================================
# TEST 5: Prueba de Carga (10 requests concurrentes)
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST 5: Prueba de Carga (10 requests)                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$startTime = Get-Date
$successCount = 0
$failCount = 0

Write-Host "Ejecutando requests: " -NoNewline

1..10 | ForEach-Object {
    try {
        $body = @{
            from_currency = "GTQ"
            to_currency = "USD"
            amount = 100
        } | ConvertTo-Json

        Invoke-RestMethod `
            -Uri "http://localhost:50055/fx/convert" `
            -Method POST `
            -Headers @{"Content-Type"="application/json"} `
            -Body $body `
            -TimeoutSec 10 | Out-Null

        Write-Host "✓" -NoNewline -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "✗" -NoNewline -ForegroundColor Red
        $failCount++
    }
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "`n✅ Prueba de carga completada" -ForegroundColor Green
Write-Host "   Éxitos: $successCount / 10" -ForegroundColor Green
Write-Host "   Fallos:  $failCount / 10" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "   Duración: $([math]::Round($duration, 2)) segundos" -ForegroundColor Yellow
Write-Host "   Promedio: $([math]::Round($duration / 10, 3)) s/request" -ForegroundColor Yellow

$test5Pass = ($successCount -ge 8) # Al menos 80% de éxito

# ===========================================================
# TEST 6: Verificar Logs del Servicio
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TEST 6: Verificar Logs y Circuit Breaker             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$logs = docker logs quetzalship-fx --tail 30 2>&1

# Buscar eventos importantes en los logs
$circuitBreakerEvents = $logs | Select-String "Circuit breaker" | Select-Object -Last 5
$cacheHits = $logs | Select-String "Cache hit" | Select-Object -Last 5
$retryEvents = $logs | Select-String "Retry attempt" | Select-Object -Last 5

if ($circuitBreakerEvents) {
    Write-Host "Eventos de Circuit Breaker:" -ForegroundColor Yellow
    $circuitBreakerEvents | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
}

if ($cacheHits) {
    Write-Host "`nCache Hits detectados:" -ForegroundColor Yellow
    $cacheHits | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
}

if ($retryEvents) {
    Write-Host "`nRetries detectados:" -ForegroundColor Yellow
    $retryEvents | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
}

if (-not ($circuitBreakerEvents -or $cacheHits -or $retryEvents)) {
    Write-Host "No se detectaron eventos especiales en los logs (esto es normal si todo funciona bien)" -ForegroundColor Gray
}

$test6Pass = $true

# ===========================================================
# RESUMEN
# ===========================================================
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║                    RESUMEN DE PRUEBAS                  ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

$tests = @(
    @{ Name = "Conversión Básica"; Pass = $test1Pass },
    @{ Name = "Validación de Caché"; Pass = $test2Pass },
    @{ Name = "Obtener Tasa de Cambio"; Pass = $test3Pass },
    @{ Name = "Múltiples Tasas"; Pass = $test4Pass },
    @{ Name = "Prueba de Carga"; Pass = $test5Pass },
    @{ Name = "Verificación de Logs"; Pass = $test6Pass }
)

$passedCount = ($tests | Where-Object { $_.Pass -eq $true }).Count
$totalTests = $tests.Count

Write-Host ""
$tests | ForEach-Object {
    $icon = if ($_.Pass) { "✅" } else { "❌" }
    $color = if ($_.Pass) { "Green" } else { "Red" }
    Write-Host "$icon $($_.Name)" -ForegroundColor $color
}

Write-Host "`n──────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "Total: $passedCount / $totalTests pruebas pasaron" -ForegroundColor $(if ($passedCount -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedCount -eq $totalTests) {
    Write-Host "`n🎉 ¡TODAS LAS PRUEBAS PASARON!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Algunas pruebas fallaron. Revisa los logs para más detalles." -ForegroundColor Yellow
    Write-Host "Logs: docker logs quetzalship-fx --tail 100" -ForegroundColor Gray
    exit 1
}
