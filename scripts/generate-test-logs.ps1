# Script para generar logs de prueba en QuetzalShip (PowerShell)
# Útil para verificar que el stack de observabilidad funciona correctamente

param(
    [string]$GatewayUrl = "http://localhost:3000"
)

$ApiBase = "$GatewayUrl/api/v1"

Write-Host "🚀 Generando logs de prueba para QuetzalShip..." -ForegroundColor Cyan
Write-Host "Gateway: $GatewayUrl`n"

# Función para hacer request y mostrar correlation ID
function Invoke-TestRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body,
        [string]$Description
    )
    
    Write-Host "→ $Description" -ForegroundColor Yellow
    
    $headers = @{
        "Content-Type" = "application/json"
        "Idempotency-Key" = "test-$(Get-Date -Format 'yyyyMMddHHmmssfff')"
    }
    
    try {
        $url = "$ApiBase$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -Body $Body -UseBasicParsing
        }
        
        $statusCode = $response.StatusCode
        $correlationId = $response.Headers['X-Correlation-ID']
        
        Write-Host "✓ Success (HTTP $statusCode)" -ForegroundColor Green
        if ($correlationId) {
            Write-Host "  Correlation ID: $correlationId" -ForegroundColor Green
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "✗ Error (HTTP $statusCode)" -ForegroundColor Red
        
        try {
            $correlationId = $_.Exception.Response.Headers.GetValues('X-Correlation-ID')[0]
            if ($correlationId) {
                Write-Host "  Correlation ID: $correlationId" -ForegroundColor Green
            }
        } catch {}
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1
}

# 1. Crear órdenes exitosas (INFO logs)
Write-Host "📦 1. Creando órdenes exitosas (Genera logs INFO)..." -ForegroundColor Cyan

Invoke-TestRequest -Method "POST" -Endpoint "/orders" -Body @"
{
  "originZone": "METRO",
  "destinationZone": "INTERIOR",
  "serviceType": "EXPRESS",
  "packages": [{
    "weightKg": 5,
    "heightCm": 30,
    "widthCm": 20,
    "lengthCm": 40,
    "fragile": false
  }],
  "insuranceEnabled": false
}
"@ -Description "Orden METRO → INTERIOR (EXPRESS)"

Invoke-TestRequest -Method "POST" -Endpoint "/orders" -Body @"
{
  "originZone": "INTERIOR",
  "destinationZone": "FRONTERA",
  "serviceType": "STANDARD",
  "packages": [{
    "weightKg": 10,
    "heightCm": 50,
    "widthCm": 30,
    "lengthCm": 60,
    "fragile": true,
    "declaredValueQ": 500
  }],
  "insuranceEnabled": true
}
"@ -Description "Orden INTERIOR → FRONTERA (STANDARD) con seguro"

Invoke-TestRequest -Method "POST" -Endpoint "/orders" -Body @"
{
  "originZone": "METRO",
  "destinationZone": "METRO",
  "serviceType": "SAME_DAY",
  "packages": [{
    "weightKg": 2,
    "heightCm": 20,
    "widthCm": 15,
    "lengthCm": 25,
    "fragile": false
  }],
  "discount": {
    "type": "PERCENT",
    "value": 10
  }
}
"@ -Description "Orden METRO → METRO (SAME_DAY) con descuento"

# 2. Listar órdenes (INFO logs)
Write-Host "📋 2. Listando órdenes (Genera logs INFO)..." -ForegroundColor Cyan
Invoke-TestRequest -Method "GET" -Endpoint "/orders?page=1&pageSize=10" -Body "" -Description "Obtener lista de órdenes"

# 3. Intentar crear orden inválida (ERROR logs)
Write-Host "❌ 3. Intentando crear órdenes inválidas (Genera logs ERROR/WARN)..." -ForegroundColor Cyan

Invoke-TestRequest -Method "POST" -Endpoint "/orders" -Body @"
{
  "originZone": "INVALID",
  "destinationZone": "METRO",
  "serviceType": "EXPRESS",
  "packages": []
}
"@ -Description "Orden con zona inválida (espera error 400)"

Invoke-TestRequest -Method "POST" -Endpoint "/orders" -Body @"
{
  "originZone": "METRO",
  "destinationZone": "INTERIOR",
  "serviceType": "EXPRESS",
  "packages": [{
    "weightKg": -5,
    "heightCm": 30,
    "widthCm": 20,
    "lengthCm": 40
  }]
}
"@ -Description "Orden con peso negativo (espera error 400)"

Invoke-TestRequest -Method "POST" -Endpoint "/orders" -Body "{}" -Description "Orden vacía (espera error 400)"

# 4. Intentar acceder a recurso inexistente (ERROR logs)
Write-Host "🔍 4. Accediendo a recursos inexistentes (Genera logs ERROR)..." -ForegroundColor Cyan
Invoke-TestRequest -Method "GET" -Endpoint "/orders/nonexistent-order-id" -Body "" -Description "Obtener orden inexistente"
Invoke-TestRequest -Method "GET" -Endpoint "/orders/fake-id-12345/receipt" -Body "" -Description "Obtener recibo de orden inexistente"

# 5. Health check (INFO logs)
Write-Host "💚 5. Health checks (Genera logs INFO)..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$GatewayUrl/health" -Method GET
    Write-Host "Health check completado: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "Health check error" -ForegroundColor Red
}
Write-Host ""

# 6. Generar carga (múltiples requests)
Write-Host "⚡ 6. Generando carga (múltiples requests simultáneos)..." -ForegroundColor Cyan
1..5 | ForEach-Object -Parallel {
    $i = $_
    $ApiBase = $using:ApiBase
    
    $headers = @{
        "Content-Type" = "application/json"
        "Idempotency-Key" = "test-load-$i-$(Get-Date -Format 'yyyyMMddHHmmssfff')"
    }
    
    $body = @"
{
  "originZone": "METRO",
  "destinationZone": "INTERIOR",
  "serviceType": "STANDARD",
  "packages": [{
    "weightKg": $i,
    "heightCm": 30,
    "widthCm": 20,
    "lengthCm": 40,
    "fragile": false
  }]
}
"@
    
    try {
        Invoke-WebRequest -Uri "$ApiBase/orders" -Method POST -Headers $headers -Body $body -UseBasicParsing | Out-Null
        Write-Host "  ✓ Orden de prueba #$i completada" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Orden de prueba #$i falló" -ForegroundColor Red
    }
} -ThrottleLimit 5

Write-Host ""
Write-Host "✅ Generación de logs completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Ahora puedes ver los logs en:" -ForegroundColor Cyan
Write-Host "  • Grafana: http://localhost:3001 (admin/quetzalship)"
Write-Host "  • Kibana:  http://localhost:5601"
Write-Host ""
Write-Host "🔍 Para rastrear una request específica:" -ForegroundColor Yellow
Write-Host "  1. Copia un 'Correlation ID' de arriba"
Write-Host "  2. Ve a Grafana → Dashboard 'QuetzalShip - Logs Avanzados'"
Write-Host "  3. Pega el ID en el campo 'Correlation ID'"
Write-Host "  4. Verás todos los logs relacionados con esa request"
Write-Host ""
