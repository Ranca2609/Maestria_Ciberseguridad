#!/bin/bash
# Deploy QuetzalShip to GKE
# Usage: ./deploy-to-gke.sh [--init]

set -e

NAMESPACE="quetzalship"
INIT_MODE=${1:-""}

echo "=========================================="
echo "  QuetzalShip GKE Deployment"
echo "=========================================="

# Check kubectl is configured
echo "Checking cluster connection..."
kubectl cluster-info || { echo "ERROR: Cannot connect to cluster"; exit 1; }

# Create namespace
echo ""
echo "Step 1: Creating namespace..."
kubectl apply -f k8s/base/namespace.yaml

# Apply secrets
echo ""
echo "Step 2: Applying secrets..."
kubectl apply -f k8s/base/secrets.yaml

# Deploy infrastructure
echo ""
echo "Step 3: Deploying infrastructure..."
echo "  - MSSQL..."
kubectl apply -f k8s/infrastructure/mssql/deployment.yaml

echo "  - Redis..."
kubectl apply -f k8s/infrastructure/redis/deployment.yaml

# Wait for MSSQL to be ready
echo ""
echo "Step 4: Waiting for infrastructure..."
kubectl rollout status deployment/mssql -n $NAMESPACE --timeout=300s
kubectl rollout status deployment/redis -n $NAMESPACE --timeout=120s

# Initialize database (only on first deploy)
if [ "$INIT_MODE" == "--init" ]; then
    echo ""
    echo "Step 4b: Initializing database..."
    kubectl apply -f k8s/infrastructure/mssql/init-job.yaml
    kubectl wait --for=condition=complete job/mssql-init -n $NAMESPACE --timeout=120s
fi

# Deploy observability stack
echo ""
echo "Step 5: Deploying observability stack..."
echo "  - Elasticsearch..."
kubectl apply -f k8s/observability/elasticsearch/statefulset.yaml
kubectl rollout status statefulset/elasticsearch -n $NAMESPACE --timeout=300s

echo "  - Logstash..."
kubectl apply -f k8s/observability/logstash/deployment.yaml
kubectl rollout status deployment/logstash -n $NAMESPACE --timeout=120s

echo "  - Fluent Bit..."
kubectl apply -f k8s/observability/fluent-bit/daemonset.yaml

echo "  - Kibana..."
kubectl apply -f k8s/observability/kibana/deployment.yaml
kubectl rollout status deployment/kibana -n $NAMESPACE --timeout=120s

echo "  - Grafana..."
kubectl apply -f k8s/observability/grafana/deployment.yaml
kubectl rollout status deployment/grafana -n $NAMESPACE --timeout=120s

# Deploy microservices
echo ""
echo "Step 6: Deploying microservices..."
echo "  - Pricing service..."
kubectl apply -f k8s/applications/pricing/
kubectl rollout status deployment/pricing -n $NAMESPACE --timeout=120s

echo "  - Orders service..."
kubectl apply -f k8s/applications/orders/
kubectl rollout status deployment/orders -n $NAMESPACE --timeout=120s

echo "  - Receipt service..."
kubectl apply -f k8s/applications/receipt/
kubectl rollout status deployment/receipt -n $NAMESPACE --timeout=120s

echo "  - FX service..."
kubectl apply -f k8s/applications/fx/
kubectl rollout status deployment/fx -n $NAMESPACE --timeout=120s

echo "  - Gateway..."
kubectl apply -f k8s/applications/gateway/
kubectl rollout status deployment/gateway -n $NAMESPACE --timeout=120s

echo "  - Frontend..."
kubectl apply -f k8s/applications/frontend/
kubectl rollout status deployment/frontend -n $NAMESPACE --timeout=120s

# Apply ingress
echo ""
echo "Step 7: Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

# Get external IP
echo ""
echo "Step 8: Getting external IP..."
for i in {1..30}; do
    IP=$(kubectl get ingress quetzalship-ingress-ip -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ -n "$IP" ]; then
        break
    fi
    echo "Waiting for Ingress IP... ($i/30)"
    sleep 10
done

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  - Frontend: http://$IP"
echo "  - API:      http://$IP/api"
echo "  - Swagger:  http://$IP/api-docs"
echo "  - Kibana:   http://$IP/kibana"
echo "  - Grafana:  http://$IP/grafana (admin/quetzalship)"
echo ""
echo "Run smoke tests:"
echo "  INGRESS_URL=http://$IP ./tests/smoke/smoke-test.sh"
echo ""
