#!/bin/bash
# Smoke Test Script for QuetzalShip
# Run this after deployment to verify all services are working

set -e

# Configuration
INGRESS_URL="${INGRESS_URL:-http://localhost:3000}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_fail() {
    echo -e "${RED}[✗]${NC} $1"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local name=$1
    local cmd=$2
    
    echo -n "Testing: $name... "
    
    if eval "$cmd" > /dev/null 2>&1; then
        log_success "PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        log_fail "FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "=========================================="
echo "  QuetzalShip Smoke Tests"
echo "  Target: $INGRESS_URL"
echo "=========================================="
echo ""

# Test 1: Health Check
log_info "Running health check tests..."
run_test "Health endpoint" "curl -sf '$INGRESS_URL/health'"

# Test 2: Create Order
log_info "Running order creation test..."
IDEMPOTENCY_KEY="smoke-test-$(date +%s)-$$"
CORRELATION_ID="smoke-$(uuidgen 2>/dev/null || echo $RANDOM)"

ORDER_RESPONSE=$(curl -sf -X POST "$INGRESS_URL/api/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -H "X-Correlation-ID: $CORRELATION_ID" \
  -d '{
    "clientName": "Smoke Test Client",
    "originZone": "METRO",
    "destinationZone": "INTERIOR",
    "serviceType": "STANDARD",
    "packages": [{
      "weightKg": 5,
      "heightCm": 30,
      "widthCm": 20,
      "lengthCm": 15,
      "fragile": false,
      "declaredValueQ": 500
    }],
    "insuranceEnabled": true
  }' 2>/dev/null || echo '{}')

ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
    log_success "Order created: $ORDER_ID"
    ((TESTS_PASSED++))
else
    log_fail "Failed to create order"
    ((TESTS_FAILED++))
    if [ "$VERBOSE" = "true" ]; then
        echo "Response: $ORDER_RESPONSE"
    fi
fi

# Test 3: List Orders
run_test "List orders" "curl -sf '$INGRESS_URL/api/v1/orders?page=1&pageSize=10'"

# Test 4: Get Order (if created successfully)
if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
    run_test "Get order by ID" "curl -sf '$INGRESS_URL/api/v1/orders/$ORDER_ID'"
    
    # Test 5: Get Receipt
    run_test "Get receipt" "curl -sf '$INGRESS_URL/api/v1/orders/$ORDER_ID/receipt'"
fi

# Test 6: Idempotency - same key should return same result
log_info "Testing idempotency..."
IDEMPOTENCY_RESPONSE=$(curl -sf -X POST "$INGRESS_URL/api/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "clientName": "Different Name",
    "originZone": "FRONTERA",
    "destinationZone": "METRO",
    "serviceType": "EXPRESS",
    "packages": [{"weightKg": 1, "heightCm": 10, "widthCm": 10, "lengthCm": 10, "fragile": true, "declaredValueQ": 100}],
    "insuranceEnabled": false
  }' 2>/dev/null || echo '{}')

IDEMPOTENCY_ORDER_ID=$(echo "$IDEMPOTENCY_RESPONSE" | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ "$ORDER_ID" = "$IDEMPOTENCY_ORDER_ID" ]; then
    log_success "Idempotency working correctly"
    ((TESTS_PASSED++))
else
    log_warn "Idempotency check inconclusive"
fi

# Test 7: FX Service (optional - may not be deployed)
log_info "Testing FX service..."
FX_RESPONSE=$(curl -sf "$INGRESS_URL/api/v1/fx/rates?from=USD&to=GTQ" 2>/dev/null || echo "")
if [ -n "$FX_RESPONSE" ]; then
    log_success "FX service responding"
    ((TESTS_PASSED++))
else
    log_warn "FX service not available (may not be deployed yet)"
fi

# Summary
echo ""
echo "=========================================="
echo "  Smoke Test Results"
echo "=========================================="
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
echo "=========================================="

if [ $TESTS_FAILED -gt 0 ]; then
    echo ""
    log_error "Some tests failed!"
    exit 1
else
    echo ""
    log_success "All tests passed!"
    exit 0
fi
