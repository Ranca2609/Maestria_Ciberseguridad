import { useState, useEffect } from 'react'
import { api } from '../services/api'

function OrderList({ onViewOrder }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageToken, setPageToken] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const loadOrders = async (token = '') => {
    try {
      setLoading(true)
      setError(null)
      const result = await api.listOrders(10, token)

      if (token) {
        setOrders(prev => [...prev, ...result.orders])
      } else {
        setOrders(result.orders)
      }

      setPageToken(result.nextPageToken)
      setHasMore(!!result.nextPageToken)
      setTotalCount(result.totalCount)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleLoadMore = () => {
    loadOrders(pageToken)
  }

  const getStatusBadge = (status) => {
    const classes = status === 'ACTIVE' ? 'badge badge-active' : 'badge badge-cancelled'
    const label = status === 'ACTIVE' ? 'Activa' : 'Cancelada'
    return <span className={classes}>{label}</span>
  }

  const getZoneBadge = (zone) => {
    const zoneMap = {
      'METRO': { class: 'badge badge-metro', label: 'Metro' },
      'INTERIOR': { class: 'badge badge-interior', label: 'Interior' },
      'FRONTERA': { class: 'badge badge-frontera', label: 'Frontera' },
    }
    const zoneInfo = zoneMap[zone] || { class: 'badge', label: zone }
    return <span className={zoneInfo.class}>{zoneInfo.label}</span>
  }

  const getServiceType = (type) => {
    const typeMap = {
      'STANDARD': 'Standard',
      'EXPRESS': 'Express',
      'SAME_DAY': 'Same Day',
    }
    return typeMap[type] || type
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error">
          Error al cargar órdenes: {error}
        </div>
        <button className="btn btn-primary" onClick={() => loadOrders()}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Lista de Órdenes ({totalCount})</h2>

      {loading && orders.length === 0 ? (
        <div className="loading">Cargando órdenes...</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No hay órdenes registradas</p>
          <p>Crea tu primera orden de envío</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
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
                      <code>{order.orderId.slice(0, 8)}...</code>
                    </td>
                    <td>{getZoneBadge(order.destinationZone)}</td>
                    <td>{getServiceType(order.serviceType)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td><strong>{order.totalFormatted}</strong></td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onViewOrder(order.orderId)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="btn-group" style={{ justifyContent: 'center', marginTop: '1rem' }}>
              <button
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default OrderList
