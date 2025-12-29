#!/bin/bash

# Script para generar logs de prueba en QuetzalShip
# Útil para verificar que el stack de observabilidad funciona correctamente

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"
API_BASE="${GATEWAY_URL}/api/v1"

echo "🚀 Generando logs de prueba para QuetzalShip..."
echo "Gateway: $GATEWAY_URL"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para hacer request y mostrar correlation ID
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}→ $description${NC}"
  
  response=$(curl -s -w "\n%{http_code}\n" -X $method "$API_BASE$endpoint" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: test-$(date +%s%N)" \
    -d "$data" -D -)
  
  http_code=$(echo "$response" | tail -1)
  headers=$(echo "$response" | sed -n '/^HTTP/,/^$/p')
  correlation_id=$(echo "$headers" | grep -i "x-correlation-id" | cut -d' ' -f2 | tr -d '\r')
  
  if [ $http_code -ge 200 ] && [ $http_code -lt 300 ]; then
    echo -e "${GREEN}✓ Success (HTTP $http_code)${NC}"
  elif [ $http_code -ge 400 ]; then
    echo -e "${RED}✗ Error (HTTP $http_code)${NC}"
  else
    echo -e "${YELLOW}⚠ Response (HTTP $http_code)${NC}"
  fi
  
  if [ ! -z "$correlation_id" ]; then
    echo -e "  Correlation ID: ${GREEN}$correlation_id${NC}"
  fi
  
  echo ""
  sleep 1
}

# 1. Crear órdenes exitosas (INFO logs)
echo "📦 1. Creando órdenes exitosas (Genera logs INFO)..."
make_request "POST" "/orders" '{
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
}' "Orden METRO → INTERIOR (EXPRESS)"

make_request "POST" "/orders" '{
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
}' "Orden INTERIOR → FRONTERA (STANDARD) con seguro"

make_request "POST" "/orders" '{
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
}' "Orden METRO → METRO (SAME_DAY) con descuento"

# 2. Listar órdenes (INFO logs)
echo "📋 2. Listando órdenes (Genera logs INFO)..."
make_request "GET" "/orders?page=1&pageSize=10" "" "Obtener lista de órdenes"

# 3. Intentar crear orden inválida (ERROR logs)
echo "❌ 3. Intentando crear órdenes inválidas (Genera logs ERROR/WARN)..."
make_request "POST" "/orders" '{
  "originZone": "INVALID",
  "destinationZone": "METRO",
  "serviceType": "EXPRESS",
  "packages": []
}' "Orden con zona inválida (espera error 400)"

make_request "POST" "/orders" '{
  "originZone": "METRO",
  "destinationZone": "INTERIOR",
  "serviceType": "EXPRESS",
  "packages": [{
    "weightKg": -5,
    "heightCm": 30,
    "widthCm": 20,
    "lengthCm": 40
  }]
}' "Orden con peso negativo (espera error 400)"

make_request "POST" "/orders" '{}' "Orden vacía (espera error 400)"

# 4. Intentar acceder a recurso inexistente (ERROR logs)
echo "🔍 4. Accediendo a recursos inexistentes (Genera logs ERROR)..."
make_request "GET" "/orders/nonexistent-order-id" "" "Obtener orden inexistente"
make_request "GET" "/orders/fake-id-12345/receipt" "" "Obtener recibo de orden inexistente"

# 5. Health check (INFO logs)
echo "💚 5. Health checks (Genera logs INFO)..."
curl -s "$GATEWAY_URL/health" | jq '.' 2>/dev/null || echo "Health check completado"
echo ""

# 6. Generar carga (múltiples requests)
echo "⚡ 6. Generando carga (múltiples requests simultáneos)..."
for i in {1..5}; do
  make_request "POST" "/orders" '{
    "originZone": "METRO",
    "destinationZone": "INTERIOR",
    "serviceType": "STANDARD",
    "packages": [{
      "weightKg": '$i',
      "heightCm": 30,
      "widthCm": 20,
      "lengthCm": 40,
      "fragile": false
    }]
  }' "Orden de prueba #$i" &
done
wait

echo ""
echo "✅ Generación de logs completada!"
echo ""
echo "📊 Ahora puedes ver los logs en:"
echo "  • Grafana: http://localhost:3001 (admin/quetzalship)"
echo "  • Kibana:  http://localhost:5601"
echo ""
echo "🔍 Para rastrear una request específica:"
echo "  1. Copia un 'Correlation ID' de arriba"
echo "  2. Ve a Grafana → Dashboard 'QuetzalShip - Logs Avanzados'"
echo "  3. Pega el ID en el campo 'Correlation ID'"
echo "  4. Verás todos los logs relacionados con esa request"
echo ""
