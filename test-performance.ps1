#!/usr/bin/env pwsh
# Quick test script to verify the performance optimizations

Write-Host "=== QuetzalShip Performance Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/4] Testing Gateway Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "✓ Gateway is healthy" -ForegroundColor Green
} catch {
    Write-Host "✗ Gateway health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Create Order (test database connection pool)
Write-Host "[2/4] Creating test order..." -ForegroundColor Yellow
$orderPayload = @{
    originZone = "METRO"
    destinationZone = "INTERIOR"
    serviceType = "STANDARD"
    packages = @(
        @{
            weightKg = 5.5
            heightCm = 30
            widthCm = 20
            lengthCm = 40
            fragile = $false
            declaredValueQ = 500
        }
    )
    insuranceEnabled = $false
} | ConvertTo-Json

try {
    $order = Invoke-RestMethod -Uri "http://localhost:3000/v1/orders" `
        -Method Post `
        -Body $orderPayload `
        -ContentType "application/json" `
        -Headers @{ "Idempotency-Key" = [guid]::NewGuid().ToString() }
    
    Write-Host "✓ Order created: $($order.orderId)" -ForegroundColor Green
    $testOrderId = $order.orderId
} catch {
    Write-Host "✗ Order creation failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: List Orders (test optimized pagination)
Write-Host "[3/4] Testing list orders (optimized pagination)..." -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $orders = Invoke-RestMethod -Uri "http://localhost:3000/v1/orders?page=1&pageSize=20" -Method Get
    $duration = (Get-Date) - $startTime
    
    Write-Host "✓ Listed $($orders.orders.Count) orders in $($duration.TotalMilliseconds)ms" -ForegroundColor Green
    Write-Host "  Total orders in DB: $($orders.totalCount)" -ForegroundColor Gray
    
    if ($duration.TotalMilliseconds -gt 1000) {
        Write-Host "  Warning: Response time > 1s, may need further optimization" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ List orders failed: $_" -ForegroundColor Red
    exit 1
}

# Test 4: Get Order Details
Write-Host "[4/4] Testing get order details..." -ForegroundColor Yellow
try {
    $startTime = Get-Date
    $orderDetails = Invoke-RestMethod -Uri "http://localhost:3000/v1/orders/$testOrderId" -Method Get
    $duration = (Get-Date) - $startTime
    
    Write-Host "✓ Retrieved order details in $($duration.TotalMilliseconds)ms" -ForegroundColor Green
} catch {
    Write-Host "✗ Get order details failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== All Tests Passed! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open Locust UI: http://localhost:8089" -ForegroundColor White
Write-Host "2. Configure load test:" -ForegroundColor White
Write-Host "   - Number of users: 100 (start small)" -ForegroundColor Gray
Write-Host "   - Spawn rate: 10 users/second" -ForegroundColor Gray
Write-Host "3. Monitor for 504/500 errors" -ForegroundColor White
Write-Host "4. Gradually increase to 500 users" -ForegroundColor White
Write-Host ""
Write-Host "Monitoring:" -ForegroundColor Cyan
Write-Host "- Kibana: http://localhost:5601" -ForegroundColor White
Write-Host "- Grafana: http://localhost:3001 (admin/quetzalship)" -ForegroundColor White
