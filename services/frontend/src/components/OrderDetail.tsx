import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services';
import { OrderDetail as OrderDetailType, OrderStatus } from '../types';

const ZONE_NAMES: Record<string, string> = {
  METRO: 'Metropolitana',
  INTERIOR: 'Interior',
  FRONTERA: 'Frontera',
};

const SERVICE_NAMES: Record<string, string> = {
  STANDARD: 'Estándar',
  EXPRESS: 'Express',
  SAME_DAY: 'Mismo Día',
};

export function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getOrder(orderId!);
      setOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('¿Está seguro de cancelar esta orden?')) return;

    try {
      await apiService.cancelOrder(orderId!);
      loadOrder();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar');
    }
  };

  if (loading) {
    return <div className="loading">Cargando orden...</div>;
  }

  if (error || !order) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || 'Orden no encontrada'}</div>
        <Link to="/orders" className="back-link">← Volver a la lista</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <Link to="/orders" className="back-link">← Volver a la lista</Link>

      <h2>
        Orden {order.orderId}
        <span className={`badge ${order.status === OrderStatus.ACTIVE ? 'badge-active' : 'badge-cancelled'}`} style={{ marginLeft: 10 }}>
          {order.status === OrderStatus.ACTIVE ? 'Activa' : 'Cancelada'}
        </span>
      </h2>

      <div className="detail-grid">
        <div>
          <h3>Información del Envío</h3>
          <table className="breakdown-table">
            <tbody>
              <tr>
                <td>Fecha de creación:</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Zona de origen:</td>
                <td>{ZONE_NAMES[order.originZone] || order.originZone}</td>
              </tr>
              <tr>
                <td>Zona de destino:</td>
                <td>{ZONE_NAMES[order.destinationZone] || order.destinationZone}</td>
              </tr>
              <tr>
                <td>Tipo de servicio:</td>
                <td>{SERVICE_NAMES[order.serviceType] || order.serviceType}</td>
              </tr>
              <tr>
                <td>Seguro habilitado:</td>
                <td>{order.insuranceEnabled ? 'Sí' : 'No'}</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ marginTop: 20 }}>Paquetes ({order.packages.length})</h3>
          {order.packages.map((pkg, index) => (
            <div key={index} className="package-card">
              <h4>Paquete {index + 1}</h4>
              <p>Peso: {pkg.weightKg} kg | Dimensiones: {pkg.heightCm}x{pkg.widthCm}x{pkg.lengthCm} cm</p>
              <p>Frágil: {pkg.fragile ? 'Sí' : 'No'} | Valor declarado: Q{pkg.declaredValueQ}</p>
            </div>
          ))}
        </div>

        <div>
          <h3>Desglose de Costos</h3>
          <table className="breakdown-table">
            <tbody>
              <tr>
                <td>Peso tarifable:</td>
                <td>{order.breakdown.orderBillableKg} kg</td>
              </tr>
              <tr>
                <td>Tarifa por kg:</td>
                <td>Q{order.breakdown.ratePerKg}/kg</td>
              </tr>
              <tr>
                <td>Subtotal base:</td>
                <td>Q{order.breakdown.baseSubtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Multiplicador servicio:</td>
                <td>x{order.breakdown.serviceMultiplier}</td>
              </tr>
              <tr>
                <td>Subtotal servicio:</td>
                <td>Q{order.breakdown.serviceSubtotal.toFixed(2)}</td>
              </tr>
              {order.breakdown.fragileSurcharge > 0 && (
                <tr>
                  <td>Recargo frágil ({order.breakdown.fragilePackagesCount} paq.):</td>
                  <td>Q{order.breakdown.fragileSurcharge.toFixed(2)}</td>
                </tr>
              )}
              {order.breakdown.insuranceSurcharge > 0 && (
                <tr>
                  <td>Recargo seguro (2.5%):</td>
                  <td>Q{order.breakdown.insuranceSurcharge.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td>Subtotal con recargos:</td>
                <td>Q{order.breakdown.subtotalWithSurcharges.toFixed(2)}</td>
              </tr>
              {order.breakdown.discountAmount > 0 && (
                <tr>
                  <td>Descuento:</td>
                  <td>-Q{order.breakdown.discountAmount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="total">
                <td>TOTAL:</td>
                <td>Q{order.breakdown.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="actions">
        <Link to={`/orders/${order.orderId}/receipt`} className="btn btn-success">
          Ver Recibo
        </Link>
        {order.status === OrderStatus.ACTIVE && (
          <button className="btn btn-danger" onClick={handleCancel}>
            Cancelar Orden
          </button>
        )}
      </div>
    </div>
  );
}
