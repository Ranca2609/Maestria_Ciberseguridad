#!/usr/bin/env pwsh
# QuetzalShip Locust Test Runner
# Ejecuta pruebas de carga con diferentes configuraciones

param(
    [Parameter(HelpMessage="Tipo de prueba: quick, normal, stress, spike, soak")]
    [ValidateSet("quick", "normal", "stress", "spike", "soak", "custom")]
    [string]$TestType = "quick",
    
    [Parameter(HelpMessage="URL del host (default: http://localhost:3000)")]
    [string]$Host = "http://localhost:3000",
    
    [Parameter(HelpMessage="Número de usuarios (solo para custom)")]
    [int]$Users = 100,
    
    [Parameter(HelpMessage="Spawn rate (solo para custom)")]
    [int]$SpawnRate = 10,
    
    [Parameter(HelpMessage="Duración (solo para custom, ej: 5m, 60s)")]
    [string]$Duration = "5m",
    
    [Parameter(HelpMessage="Generar reporte HTML")]
    [switch]$GenerateReport
)

# Colores para output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Verificar si Locust está instalado
Write-ColorOutput "🔍 Verificando instalación de Locust..." "Cyan"
$locustInstalled = Get-Command locust -ErrorAction SilentlyContinue

if (-not $locustInstalled) {
    Write-ColorOutput "❌ Locust no está instalado. Instalando..." "Red"
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "❌ Error al instalar Locust. Verifica que Python y pip estén instalados." "Red"
        exit 1
    }
    Write-ColorOutput "✅ Locust instalado correctamente" "Green"
}

# Cambiar al directorio de pruebas
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-ColorOutput "`n📊 QuetzalShip Load Testing" "Yellow"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Yellow"

# Configurar parámetros según el tipo de prueba
$testConfig = @{}

switch ($TestType) {
    "quick" {
        $testConfig = @{
            Users = 50
            SpawnRate = 10
            Duration = "1m"
            Description = "Prueba rápida de validación"
        }
    }
    "normal" {
        $testConfig = @{
            Users = 100
            SpawnRate = 10
            Duration = "10m"
            Description = "Prueba de carga normal"
        }
    }
    "stress" {
        $testConfig = @{
            Users = 300
            SpawnRate = 30
            Duration = "5m"
            Description = "Prueba de estrés"
        }
    }
    "spike" {
        $testConfig = @{
            Users = 500
            SpawnRate = 50
            Duration = "2m"
            Description = "Prueba de pico"
        }
    }
    "soak" {
        $testConfig = @{
            Users = 50
            SpawnRate = 5
            Duration = "2h"
            Description = "Prueba de resistencia"
        }
    }
    "custom" {
        $testConfig = @{
            Users = $Users
            SpawnRate = $SpawnRate
            Duration = $Duration
            Description = "Prueba personalizada"
        }
    }
}

Write-ColorOutput "Tipo de prueba: $($testConfig.Description)" "Cyan"
Write-ColorOutput "Host: $Host" "Cyan"
Write-ColorOutput "Usuarios: $($testConfig.Users)" "Cyan"
Write-ColorOutput "Spawn Rate: $($testConfig.SpawnRate)/s" "Cyan"
Write-ColorOutput "Duración: $($testConfig.Duration)" "Cyan"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Yellow"

# Verificar conectividad con el host
Write-ColorOutput "🔌 Verificando conectividad con $Host..." "Cyan"
try {
    $healthCheck = Invoke-WebRequest -Uri "$Host/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-ColorOutput "✅ Servidor accesible (Status: $($healthCheck.StatusCode))" "Green"
} catch {
    Write-ColorOutput "⚠️  Advertencia: No se pudo conectar al servidor" "Yellow"
    Write-ColorOutput "   Continuando de todos modos..." "Yellow"
}

# Construir comando de Locust
$locustCmd = "locust -f locustfile.py --host $Host --headless -u $($testConfig.Users) -r $($testConfig.SpawnRate) -t $($testConfig.Duration)"

# Agregar generación de reporte si está habilitado
if ($GenerateReport) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportName = "report_${TestType}_${timestamp}"
    $locustCmd += " --html ${reportName}.html --csv ${reportName}"
    Write-ColorOutput "📊 Se generará reporte: ${reportName}.html" "Green"
}

Write-ColorOutput "`n🚀 Iniciando prueba de carga..." "Green"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Yellow"

# Ejecutar Locust
Invoke-Expression $locustCmd

$exitCode = $LASTEXITCODE

Write-ColorOutput "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Yellow"

if ($exitCode -eq 0) {
    Write-ColorOutput "✅ Prueba completada exitosamente" "Green"
    
    if ($GenerateReport) {
        Write-ColorOutput "`n📊 Reportes generados:" "Cyan"
        Get-ChildItem -Filter "report_${TestType}_*.html" | ForEach-Object {
            Write-ColorOutput "   - $($_.Name)" "White"
        }
    }
} else {
    Write-ColorOutput "❌ La prueba finalizó con errores (código: $exitCode)" "Red"
}

Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" "Yellow"

exit $exitCode
