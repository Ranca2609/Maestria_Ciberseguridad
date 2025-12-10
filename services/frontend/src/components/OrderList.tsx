import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services';
import { OrderSummary, OrderStatus } from '../types';

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

export function OrderList() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.listOrders(page, pageSize);
      setOrders(result.orders);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('¿Está seguro de cancelar esta orden?')) return;

    try {
      await apiService.cancelOrder(orderId);
      loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return <div className="loading">Cargando órdenes...</div>;
  }

  return (
    <div className="card">
      <h2>Lista de Órdenes</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="alert alert-info">No hay órdenes registradas.</div>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Destino</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td>
                    <Link to={`/orders/${order.orderId}`}>{order.orderId}</Link>
                  </td>
                  <td>{ZONE_NAMES[order.destinationZone] || order.destinationZone}</td>
                  <td>{SERVICE_NAMES[order.serviceType] || order.serviceType}</td>
                  <td>
                    <span className={`badge ${order.status === OrderStatus.ACTIVE ? 'badge-active' : 'badge-cancelled'}`}>
                      {order.status === OrderStatus.ACTIVE ? 'Activa' : 'Cancelada'}
                    </span>
                  </td>
                  <td>Q{order.total.toFixed(2)}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <Link to={`/orders/${order.orderId}`} className="btn btn-secondary btn-sm">
                      Ver
                    </Link>
                    {' '}
                    <Link to={`/orders/${order.orderId}/receipt`} className="btn btn-success btn-sm">
                      Recibo
                    </Link>
                    {' '}
                    {order.status === OrderStatus.ACTIVE && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(order.orderId)}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="actions" style={{ justifyContent: 'center', marginTop: 20 }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span style={{ padding: '10px 20px' }}>
                Página {page} de {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
