#!/bin/bash
# QuetzalShip Locust Test Runner
# Ejecuta pruebas de carga con diferentes configuraciones

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Valores por defecto
TEST_TYPE="quick"
HOST="http://localhost:3000"
USERS=100
SPAWN_RATE=10
DURATION="5m"
GENERATE_REPORT=false

# Función para mostrar ayuda
show_help() {
    echo -e "${CYAN}QuetzalShip Locust Test Runner${NC}"
    echo ""
    echo "Uso: ./run-locust.sh [opciones]"
    echo ""
    echo "Opciones:"
    echo "  -t, --type TYPE        Tipo de prueba: quick, normal, stress, spike, soak, custom (default: quick)"
    echo "  -h, --host HOST        URL del host (default: http://localhost:3000)"
    echo "  -u, --users NUM        Número de usuarios (solo para custom)"
    echo "  -r, --rate NUM         Spawn rate (solo para custom)"
    echo "  -d, --duration TIME    Duración (solo para custom, ej: 5m, 60s)"
    echo "  -g, --generate-report  Generar reporte HTML"
    echo "  --help                 Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./run-locust.sh -t quick"
    echo "  ./run-locust.sh -t stress -g"
    echo "  ./run-locust.sh -t custom -u 200 -r 20 -d 10m -g"
    exit 0
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -h|--host)
            HOST="$2"
            shift 2
            ;;
        -u|--users)
            USERS="$2"
            shift 2
            ;;
        -r|--rate)
            SPAWN_RATE="$2"
            shift 2
            ;;
        -d|--duration)
            DURATION="$2"
            shift 2
            ;;
        -g|--generate-report)
            GENERATE_REPORT=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo -e "${RED}Opción desconocida: $1${NC}"
            show_help
            ;;
    esac
done

# Verificar si Locust está instalado
echo -e "${CYAN}🔍 Verificando instalación de Locust...${NC}"
if ! command -v locust &> /dev/null; then
    echo -e "${RED}❌ Locust no está instalado. Instalando...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Locust instalado correctamente${NC}"
fi

# Cambiar al directorio del script
cd "$(dirname "$0")"

echo -e "\n${YELLOW}📊 QuetzalShip Load Testing${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Configurar parámetros según el tipo de prueba
case $TEST_TYPE in
    quick)
        USERS=50
        SPAWN_RATE=10
        DURATION="1m"
        DESCRIPTION="Prueba rápida de validación"
        ;;
    normal)
        USERS=100
        SPAWN_RATE=10
        DURATION="10m"
        DESCRIPTION="Prueba de carga normal"
        ;;
    stress)
        USERS=300
        SPAWN_RATE=30
        DURATION="5m"
        DESCRIPTION="Prueba de estrés"
        ;;
    spike)
        USERS=500
        SPAWN_RATE=50
        DURATION="2m"
        DESCRIPTION="Prueba de pico"
        ;;
    soak)
        USERS=50
        SPAWN_RATE=5
        DURATION="2h"
        DESCRIPTION="Prueba de resistencia"
        ;;
    custom)
        DESCRIPTION="Prueba personalizada"
        ;;
    *)
        echo -e "${RED}Tipo de prueba desconocido: $TEST_TYPE${NC}"
        echo "Tipos válidos: quick, normal, stress, spike, soak, custom"
        exit 1
        ;;
esac

echo -e "${CYAN}Tipo de prueba: $DESCRIPTION${NC}"
echo -e "${CYAN}Host: $HOST${NC}"
echo -e "${CYAN}Usuarios: $USERS${NC}"
echo -e "${CYAN}Spawn Rate: $SPAWN_RATE/s${NC}"
echo -e "${CYAN}Duración: $DURATION${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Verificar conectividad con el host
echo -e "${CYAN}🔌 Verificando conectividad con $HOST...${NC}"
if curl -s -f "$HOST/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor accesible${NC}"
else
    echo -e "${YELLOW}⚠️  Advertencia: No se pudo conectar al servidor${NC}"
    echo -e "${YELLOW}   Continuando de todos modos...${NC}"
fi

# Construir comando de Locust
LOCUST_CMD="locust -f locustfile.py --host $HOST --headless -u $USERS -r $SPAWN_RATE -t $DURATION"

# Agregar generación de reporte si está habilitado
if [ "$GENERATE_REPORT" = true ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    REPORT_NAME="report_${TEST_TYPE}_${TIMESTAMP}"
    LOCUST_CMD="$LOCUST_CMD --html ${REPORT_NAME}.html --csv ${REPORT_NAME}"
    echo -e "${GREEN}📊 Se generará reporte: ${REPORT_NAME}.html${NC}"
fi

echo -e "\n${GREEN}🚀 Iniciando prueba de carga...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Ejecutar Locust
$LOCUST_CMD

EXIT_CODE=$?

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Prueba completada exitosamente${NC}"
    
    if [ "$GENERATE_REPORT" = true ]; then
        echo -e "\n${CYAN}📊 Reportes generados:${NC}"
        ls -1 report_${TEST_TYPE}_*.html 2>/dev/null | while read file; do
            echo -e "   ${NC}- $file${NC}"
        done
    fi
else
    echo -e "${RED}❌ La prueba finalizó con errores (código: $EXIT_CODE)${NC}"
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

exit $EXIT_CODE
