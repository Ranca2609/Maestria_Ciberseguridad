#!/usr/bin/env pwsh
# QuetzalShip - Suite de Pruebas de Carga Completa
# Ejecuta todas las pruebas estándar y genera reportes

param(
    [Parameter(HelpMessage="URL del host (default: http://localhost:3000)")]
    [string]$Host = "http://localhost:3000",
    
    [Parameter(HelpMessage="Directorio para guardar reportes")]
    [string]$OutputDir = "reports"
)

$ErrorActionPreference = "Stop"

# Colores
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Title { param($msg) Write-Host "`n$msg" -ForegroundColor Yellow }

Write-Title "╔════════════════════════════════════════════════╗"
Write-Title "║  QuetzalShip - Suite de Pruebas de Carga     ║"
Write-Title "╚════════════════════════════════════════════════╝"

# Crear directorio de reportes
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Info "Directorio de reportes creado: $OutputDir"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportDir = Join-Path $OutputDir $timestamp
New-Item -ItemType Directory -Path $reportDir | Out-Null

Write-Info "Reportes se guardarán en: $reportDir"
Write-Info "Host objetivo: $Host`n"

# Verificar conectividad
Write-Info "Verificando conectividad con el servidor..."
try {
    $health = Invoke-WebRequest -Uri "$Host/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Success "Servidor accesible (Status: $($health.StatusCode))"
} catch {
    Write-Error "No se pudo conectar al servidor en $Host"
    Write-Error "Asegúrate de que el servidor esté corriendo antes de ejecutar las pruebas"
    exit 1
}

# Array de pruebas a ejecutar
$tests = @(
    @{Name="Quick Validation"; Type="quick"; Users=50; Rate=10; Duration="1m"},
    @{Name="Normal Load"; Type="normal"; Users=100; Rate=10; Duration="5m"},
    @{Name="Stress Test"; Type="stress"; Users=300; Rate=30; Duration="3m"}
)

$results = @()

# Ejecutar cada prueba
foreach ($test in $tests) {
    Write-Title "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Title "Ejecutando: $($test.Name)"
    Write-Title "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    $reportName = "$($test.Type)_$timestamp"
    $reportPath = Join-Path $reportDir $reportName
    
    Write-Info "Configuración:"
    Write-Info "  - Usuarios: $($test.Users)"
    Write-Info "  - Spawn Rate: $($test.Rate)/s"
    Write-Info "  - Duración: $($test.Duration)`n"
    
    $startTime = Get-Date
    
    try {
        # Ejecutar Locust
        $cmd = "locust -f locustfile.py --host $Host --headless " +
               "-u $($test.Users) -r $($test.Rate) -t $($test.Duration) " +
               "--html `"${reportPath}.html`" --csv `"${reportPath}`""
        
        Invoke-Expression $cmd
        
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Prueba completada exitosamente"
            $status = "SUCCESS"
        } else {
            Write-Error "Prueba completada con errores"
            $status = "FAILED"
        }
    } catch {
        Write-Error "Error al ejecutar la prueba: $_"
        $status = "ERROR"
        $endTime = Get-Date
        $duration = $endTime - $startTime
    }
    
    # Guardar resultados
    $results += @{
        Name = $test.Name
        Type = $test.Type
        Status = $status
        Duration = $duration.ToString("hh\:mm\:ss")
        ReportPath = "${reportPath}.html"
    }
    
    # Pausa entre pruebas
    if ($test -ne $tests[-1]) {
        Write-Info "`nEsperando 30 segundos antes de la siguiente prueba..."
        Start-Sleep -Seconds 30
    }
}

# Resumen final
Write-Title "`n╔════════════════════════════════════════════════╗"
Write-Title "║           RESUMEN DE PRUEBAS                  ║"
Write-Title "╚════════════════════════════════════════════════╝`n"

foreach ($result in $results) {
    $statusIcon = if ($result.Status -eq "SUCCESS") { "✅" } else { "❌" }
    Write-Host "$statusIcon $($result.Name) - $($result.Status) (Duración: $($result.Duration))"
}

Write-Title "`n📊 Reportes generados:"
Get-ChildItem -Path $reportDir -Filter "*.html" | ForEach-Object {
    Write-Host "   📄 $($_.Name)" -ForegroundColor White
}

# Generar índice HTML
$indexHtml = @"
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QuetzalShip - Reportes de Pruebas de Carga</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .meta {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 30px;
        }
        .test-grid {
            display: grid;
            gap: 20px;
            margin-top: 30px;
        }
        .test-card {
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            background: #f9f9f9;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .test-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .test-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .test-name {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
        }
        .status {
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        .status.success {
            background: #4caf50;
            color: white;
        }
        .status.failed {
            background: #f44336;
            color: white;
        }
        .test-details {
            color: #666;
            font-size: 0.95em;
            line-height: 1.6;
        }
        .test-link {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .test-link:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 QuetzalShip - Reportes de Pruebas de Carga</h1>
        <div class="meta">
            <strong>Fecha:</strong> $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")<br>
            <strong>Host:</strong> $Host<br>
            <strong>Total de pruebas:</strong> $($results.Count)
        </div>
        
        <div class="test-grid">
"@

foreach ($result in $results) {
    $statusClass = if ($result.Status -eq "SUCCESS") { "success" } else { "failed" }
    $reportFile = Split-Path $result.ReportPath -Leaf
    
    $indexHtml += @"
            <div class="test-card">
                <div class="test-header">
                    <div class="test-name">$($result.Name)</div>
                    <div class="status $statusClass">$($result.Status)</div>
                </div>
                <div class="test-details">
                    <strong>Tipo:</strong> $($result.Type)<br>
                    <strong>Duración:</strong> $($result.Duration)
                </div>
                <a href="$reportFile" class="test-link" target="_blank">Ver Reporte Detallado</a>
            </div>
"@
}

$indexHtml += @"
        </div>
    </div>
</body>
</html>
"@

$indexPath = Join-Path $reportDir "index.html"
$indexHtml | Out-File -FilePath $indexPath -Encoding UTF8

Write-Success "`n✨ Índice de reportes generado: $indexPath"
Write-Info "Abre este archivo en tu navegador para ver todos los reportes`n"

Write-Title "╔════════════════════════════════════════════════╗"
Write-Title "║        SUITE DE PRUEBAS COMPLETADA           ║"
Write-Title "╚════════════════════════════════════════════════╝`n"
