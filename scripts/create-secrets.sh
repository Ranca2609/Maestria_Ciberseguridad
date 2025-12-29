#!/bin/bash
# Script to create Kubernetes secrets from environment variables or files
# Usage: ./create-secrets.sh [--apply]

set -e

NAMESPACE="quetzalship"
APPLY=${1:-"--dry-run"}

echo "=========================================="
echo "  QuetzalShip Secret Generator"
echo "=========================================="

# Check for required environment variables
check_required() {
    local var_name=$1
    local var_value=${!var_name}
    if [ -z "$var_value" ]; then
        echo "WARNING: $var_name is not set"
        return 1
    fi
    echo "OK: $var_name is set"
    return 0
}

echo ""
echo "Checking required environment variables..."
echo ""

# MSSQL
echo "--- MSSQL ---"
check_required "MSSQL_SA_PASSWORD" || MSSQL_SA_PASSWORD="QuetzalShip2024!"

# FX API Keys
echo "--- FX API ---"
check_required "FX_PRIMARY_API_KEY" || FX_PRIMARY_API_KEY="demo"
check_required "FX_FALLBACK_API_KEY" || FX_FALLBACK_API_KEY="demo"

# GHCR (optional)
echo "--- GHCR ---"
check_required "GHCR_USERNAME" || GHCR_USERNAME=""
check_required "GHCR_TOKEN" || GHCR_TOKEN=""

echo ""
echo "Generating secrets..."
echo ""

# Create namespace if not exists
if [ "$APPLY" == "--apply" ]; then
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
fi

# MSSQL Secret
cat <<EOF | kubectl apply --dry-run=${APPLY#--} -f -
apiVersion: v1
kind: Secret
metadata:
  name: mssql-secret
  namespace: $NAMESPACE
type: Opaque
stringData:
  SA_PASSWORD: "$MSSQL_SA_PASSWORD"
  DATABASE_URL: "mssql://sa:$MSSQL_SA_PASSWORD@mssql-service:1433/quetzalship"
EOF

# FX API Secret
cat <<EOF | kubectl apply --dry-run=${APPLY#--} -f -
apiVersion: v1
kind: Secret
metadata:
  name: fx-api-secret
  namespace: $NAMESPACE
type: Opaque
stringData:
  FX_PRIMARY_API_KEY: "$FX_PRIMARY_API_KEY"
  FX_FALLBACK_API_KEY: "$FX_FALLBACK_API_KEY"
EOF

# Redis Secret (empty password for development)
cat <<EOF | kubectl apply --dry-run=${APPLY#--} -f -
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  namespace: $NAMESPACE
type: Opaque
stringData:
  REDIS_PASSWORD: ""
EOF

# GHCR Pull Secret (only if credentials are provided)
if [ -n "$GHCR_USERNAME" ] && [ -n "$GHCR_TOKEN" ]; then
    echo "Creating GHCR pull secret..."
    if [ "$APPLY" == "--apply" ]; then
        kubectl create secret docker-registry ghcr-secret \
            --docker-server=ghcr.io \
            --docker-username="$GHCR_USERNAME" \
            --docker-password="$GHCR_TOKEN" \
            --namespace=$NAMESPACE \
            --dry-run=client -o yaml | kubectl apply -f -
    else
        echo "Would create GHCR secret for user: $GHCR_USERNAME"
    fi
else
    echo "GHCR credentials not provided, skipping pull secret"
fi

echo ""
echo "=========================================="
if [ "$APPLY" == "--apply" ]; then
    echo "  Secrets created successfully!"
else
    echo "  Dry run complete. Use --apply to create secrets."
fi
echo "=========================================="
