#!/bin/bash
# Rollback script for QuetzalShip deployments
# Usage: ./rollback.sh [service|all] [revision]

set -e

NAMESPACE="quetzalship"
SERVICE=${1:-"all"}
REVISION=${2:-""}

echo "=========================================="
echo "  QuetzalShip Rollback Tool"
echo "=========================================="

rollback_service() {
    local service=$1
    local rev=$2
    
    echo ""
    echo "Rolling back: $service"
    
    if [ -n "$rev" ]; then
        kubectl rollout undo deployment/$service -n $NAMESPACE --to-revision=$rev
    else
        kubectl rollout undo deployment/$service -n $NAMESPACE
    fi
    
    echo "Waiting for rollback to complete..."
    kubectl rollout status deployment/$service -n $NAMESPACE --timeout=120s
    
    echo "✓ $service rolled back successfully"
}

# Show current status
echo ""
echo "Current deployment status:"
kubectl get deployments -n $NAMESPACE -o wide

echo ""
echo "Rollout history:"
if [ "$SERVICE" == "all" ]; then
    for svc in pricing orders receipt fx gateway frontend; do
        echo "--- $svc ---"
        kubectl rollout history deployment/$svc -n $NAMESPACE 2>/dev/null || echo "Not found"
    done
else
    kubectl rollout history deployment/$SERVICE -n $NAMESPACE
fi

echo ""
read -p "Proceed with rollback? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Perform rollback
if [ "$SERVICE" == "all" ]; then
    for svc in pricing orders receipt fx gateway frontend; do
        rollback_service $svc "$REVISION"
    done
else
    rollback_service "$SERVICE" "$REVISION"
fi

echo ""
echo "=========================================="
echo "  Rollback complete!"
echo "=========================================="
echo ""
echo "New deployment status:"
kubectl get deployments -n $NAMESPACE -o wide
