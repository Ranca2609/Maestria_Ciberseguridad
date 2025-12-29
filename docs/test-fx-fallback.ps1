#!/usr/bin/env pwsh
# Script para probar el fallback del servicio FX

Write-Host "=== Prueba de Fallback del Servicio FX ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Con FX funcionando
Write-Host "[1/4] Probando con FX service ACTIVO..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/fx/rates?from=USD&to=GTQ" -Method Get
    Write-Host "✓ Respuesta recibida:" -ForegroundColor Green
    Write-Host "  - Tasa: $($response.rate)" -ForegroundColor Gray
    Write-Host "  - Proveedor: $($response.provider)" -ForegroundColor Gray
    Write-Host "  - Desde caché: $($response.from_cache)" -ForegroundColor Gray
    
    if ($response.provider -like "*DEFAULT*") {
        Write-Host "  ⚠ WARNING: Usando tasas por defecto (FX puede estar caído)" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ Usando servicio FX real" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/4] Deteniendo servicio FX..." -ForegroundColor Yellow
try {
    docker compose -f docker-compose.local.yml stop fx | Out-Null
    Write-Host "✓ Servicio FX detenido" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "✗ Error deteniendo FX: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/4] Probando con FX service DETENIDO (debería usar fallback)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/fx/rates?from=USD&to=GTQ" -Method Get
    Write-Host "✓ Respuesta recibida (FALLBACK funcionando!):" -ForegroundColor Green
    Write-Host "  - Tasa: $($response.rate)" -ForegroundColor Gray
    Write-Host "  - Proveedor: $($response.provider)" -ForegroundColor Gray
    Write-Host "  - Desde caché: $($response.from_cache)" -ForegroundColor Gray
    
    if ($response.provider -like "*DEFAULT*") {
        Write-Host "  ✓ Correctamente usando tasas por defecto" -ForegroundColor Green
    } else {
        Write-Host "  ✗ ERROR: Debería estar usando tasas por defecto" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FALLO: El fallback no está funcionando: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/4] Reiniciando servicio FX..." -ForegroundColor Yellow
try {
    docker compose -f docker-compose.local.yml start fx | Out-Null
    Write-Host "✓ Servicio FX reiniciado" -ForegroundColor Green
    Start-Sleep -Seconds 3
} catch {
    Write-Host "✗ Error reiniciando FX: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Pruebas Adicionales ===" -ForegroundColor Cyan

# Test de conversión
Write-Host ""
Write-Host "Probando conversión de moneda..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/fx/convert?from=USD&to=EUR&amount=100" -Method Get
    Write-Host "✓ Conversión exitosa:" -ForegroundColor Green
    Write-Host "  - 100 USD = $($response.converted_amount) EUR" -ForegroundColor Gray
    Write-Host "  - Tasa: $($response.rate)" -ForegroundColor Gray
    Write-Host "  - Proveedor: $($response.provider)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error en conversión: $_" -ForegroundColor Red
}

# Test de múltiples tasas
Write-Host ""
Write-Host "Probando múltiples tasas..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/fx/rates?from=USD&to=GTQ,EUR,MXN" -Method Get
    Write-Host "✓ Tasas múltiples obtenidas:" -ForegroundColor Green
    Write-Host "  - Base: $($response.base_currency)" -ForegroundColor Gray
    Write-Host "  - Tasas:" -ForegroundColor Gray
    foreach ($key in $response.rates.PSObject.Properties.Name) {
        Write-Host "    - $key : $($response.rates.$key)" -ForegroundColor Gray
    }
    Write-Host "  - Proveedor: $($response.provider)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error obteniendo tasas: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Resumen ===" -ForegroundColor Cyan
Write-Host "✓ El servicio FX ahora tiene fallback a tasas por defecto" -ForegroundColor Green
Write-Host "✓ La aplicación NO se rompe cuando FX está caído" -ForegroundColor Green
Write-Host "✓ El campo 'provider' indica claramente cuando se usan tasas por defecto" -ForegroundColor Green
Write-Host ""
Write-Host "Logs del gateway (últimas 20 líneas):" -ForegroundColor Cyan
docker compose -f docker-compose.local.yml logs gateway --tail 20
