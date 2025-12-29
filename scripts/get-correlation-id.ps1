# Script para hacer requests y mostrar el Correlation ID
# Uso: .\get-correlation-id.ps1

Write-Host "`n🚀 Haciendo request al Gateway..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3000/v1/orders" `
        -Method POST `
        -Headers @{ 
            "Content-Type" = "application/json"
        } `
        -Body (@{
            originZone = "METRO"
            destinationZone = "INTERIOR"
            serviceType = "EXPRESS"
            packages = @(
                @{
                    weightKg = 5
                    heightCm = 30
                    widthCm = 20
                    lengthCm = 40
                    fragile = $false
                    declaredValueQ = 100
                }
            )
            insuranceEnabled = $false
        } | ConvertTo-Json) `
        -UseBasicParsing
    
    $correlationId = $response.Headers.'X-Correlation-ID'[0]
    $body = $response.Content | ConvertFrom-Json
    
    Write-Host "`n✅ Request exitoso!" -ForegroundColor Green
    Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║           CORRELATION ID                              ║" -ForegroundColor Cyan
    Write-Host "╠═══════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  " -NoNewline -ForegroundColor Cyan
    Write-Host $correlationId -NoNewline -ForegroundColor Green
    Write-Host "  ║" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    Write-Host "`nℹ️  Orden creada: $($body.orderId)" -ForegroundColor Yellow
    Write-Host "💰 Total: Q$($body.total)" -ForegroundColor Yellow
    
    Write-Host "`n📊 Para ver los logs en Grafana:" -ForegroundColor Magenta
    Write-Host "   1. Abre: http://localhost:3001" -ForegroundColor White
    Write-Host "   2. Dashboard: 'QuetzalShip - Logs Avanzados'" -ForegroundColor White
    Write-Host "   3. En el panel de logs, busca: " -NoNewline -ForegroundColor White
    Write-Host "correlationId:`"$correlationId`"" -ForegroundColor Green
    
    Write-Host "`n💡 Copiado al portapapeles!" -ForegroundColor Cyan
    Set-Clipboard -Value $correlationId
    
} catch {
    Write-Host "`n❌ Error al hacer el request:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`nDetalles del error:" -ForegroundColor Yellow
        Write-Host ($errorBody | ConvertTo-Json -Depth 5) -ForegroundColor Yellow
    }
    
    # Intentar obtener el Correlation ID del error
    try {
        $errorResponse = $_.Exception.Response
        if ($errorResponse.Headers -and $errorResponse.Headers['X-Correlation-ID']) {
            $correlationId = $errorResponse.Headers['X-Correlation-ID']
            Write-Host "`nCorrelation ID del error: $correlationId" -ForegroundColor Yellow
        }
    } catch {}
}

Write-Host ""
