import { useState, useEffect } from 'react'
import { api } from '../services/api'

function OrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const loadOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await api.getOrder(orderId)
      setOrder(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta orden?')) return

    try {
      setCancelLoading(true)
      const result = await api.cancelOrder(orderId)
      setOrder(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  const handleViewReceipt = async () => {
    try {
      setError(null)
      const result = await api.getReceipt(orderId)
      setReceipt(result)
      setShowReceipt(true)
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getZoneLabel = (zone) => {
    const zoneMap = { 'METRO': 'Metro', 'INTERIOR': 'Interior', 'FRONTERA': 'Frontera' }
    return zoneMap[zone] || zone
  }

  const getServiceLabel = (type) => {
    const typeMap = { 'STANDARD': 'Standard', 'EXPRESS': 'Express', 'SAME_DAY': 'Same Day' }
    return typeMap[type] || type
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading">Cargando orden...</div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="card">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={onBack}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Detalle de Orden</h2>
          <button className="btn btn-secondary" onClick={onBack}>
            ← Volver
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {order && (
          <>
            <div className="form-row" style={{ marginBottom: '1.5rem' }}>
              <div>
                <strong>ID:</strong> <code>{order.orderId}</code>
              </div>
              <div>
                <strong>Estado:</strong>{' '}
                <span className={`badge ${order.status === 'ACTIVE' ? 'badge-active' : 'badge-cancelled'}`}>
                  {order.status === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                </span>
              </div>
              <div>
                <strong>Fecha:</strong> {formatDate(order.createdAt)}
              </div>
            </div>

            <div className="form-row" style={{ marginBottom: '1.5rem' }}>
              <div>
                <strong>Origen:</strong>{' '}
                <span className={`badge badge-${order.originZone.toLowerCase()}`}>
                  {getZoneLabel(order.originZone)}
                </span>
              </div>
              <div>
                <strong>Destino:</strong>{' '}
                <span className={`badge badge-${order.destinationZone.toLowerCase()}`}>
                  {getZoneLabel(order.destinationZone)}
                </span>
              </div>
              <div>
                <strong>Servicio:</strong> {getServiceLabel(order.serviceType)}
              </div>
            </div>

            <h3>Paquetes ({order.packages.length})</h3>
            {order.packages.map((pkg, index) => (
              <div key={index} className="package-item">
                <div className="package-header">
                  <span className="package-number">Paquete {index + 1}</span>
                  {pkg.fragile && <span className="badge badge-cancelled">Frágil</span>}
                </div>
                <div className="form-row">
                  <div><strong>Peso:</strong> {pkg.weightKg} kg</div>
                  <div><strong>Dimensiones:</strong> {pkg.heightCm} × {pkg.widthCm} × {pkg.lengthCm} cm</div>
                  <div><strong>Peso Volumétrico:</strong> {pkg.volumetricKg.toFixed(2)} kg</div>
                  <div><strong>Peso Tarifable:</strong> {pkg.billableKg.toFixed(2)} kg</div>
                </div>
                {pkg.declaredValueCents > 0 && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Valor Declarado:</strong> Q {(pkg.declaredValueCents / 100).toFixed(2)}
                  </div>
                )}
              </div>
            ))}

            <h3 style={{ marginTop: '1.5rem' }}>Opciones</h3>
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Seguro:</strong> {order.insuranceEnabled ? 'Sí' : 'No'}</p>
              <p><strong>Descuento:</strong>{' '}
                {order.discount.type === 'NONE' || order.discount.type === 'DISCOUNT_TYPE_UNSPECIFIED'
                  ? 'Sin descuento'
                  : order.discount.type === 'PERCENT'
                    ? `${order.discount.value}%`
                    : `Q ${(order.discount.value / 100).toFixed(2)}`
                }
              </p>
            </div>

            <h3>Desglose de Tarifas</h3>
            <div className="breakdown">
              <div className="breakdown-row">
                <span className="breakdown-label">Peso tarifable total:</span>
                <span className="breakdown-value">{order.breakdown.orderBillableKg.toFixed(2)} kg</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Tarifa por kg:</span>
                <span className="breakdown-value">{order.breakdown.ratePerKgFormatted}</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Subtotal base:</span>
                <span className="breakdown-value">{order.breakdown.baseSubtotalFormatted}</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Multiplicador servicio ({order.breakdown.serviceMultiplierPercent}%):</span>
                <span className="breakdown-value">{order.breakdown.serviceSubtotalFormatted}</span>
              </div>
              {order.breakdown.fragileSurchargeCents > 0 && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Recargo frágil:</span>
                  <span className="breakdown-value">+ {order.breakdown.fragileSurchargeFormatted}</span>
                </div>
              )}
              {order.breakdown.insuranceSurchargeCents > 0 && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Recargo seguro (2.5%):</span>
                  <span className="breakdown-value">+ {order.breakdown.insuranceSurchargeFormatted}</span>
                </div>
              )}
              <div className="breakdown-row">
                <span className="breakdown-label">Subtotal con recargos:</span>
                <span className="breakdown-value">{order.breakdown.subtotalWithSurchargesFormatted}</span>
              </div>
              {order.breakdown.discountAmountCents > 0 && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Descuento:</span>
                  <span className="breakdown-value">- {order.breakdown.discountAmountFormatted}</span>
                </div>
              )}
              <div className="breakdown-row total">
                <span className="breakdown-label">TOTAL:</span>
                <span className="breakdown-value">{order.breakdown.totalFormatted}</span>
              </div>
            </div>

            <div className="btn-group" style={{ marginTop: '1.5rem' }}>
              <button
                className="btn btn-success"
                onClick={handleViewReceipt}
              >
                Ver Recibo
              </button>
              {order.status === 'ACTIVE' && (
                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelando...' : 'Cancelar Orden'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {showReceipt && receipt && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recibo de Envío</h3>
              <button className="modal-close" onClick={() => setShowReceipt(false)}>×</button>
            </div>

            <div className="receipt">
              <div className="receipt-header">
                <div className="receipt-title">QuetzalShip</div>
                <p>Sistema de Envíos</p>
              </div>

              <div className="receipt-info">
                <div className="receipt-field">
                  <div className="receipt-field-label">Recibo ID</div>
                  <div className="receipt-field-value">{receipt.receiptId.slice(0, 8)}...</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Orden ID</div>
                  <div className="receipt-field-value">{receipt.orderId.slice(0, 8)}...</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Fecha de Orden</div>
                  <div className="receipt-field-value">{formatDate(receipt.orderCreatedAt)}</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Fecha del Recibo</div>
                  <div className="receipt-field-value">{formatDate(receipt.generatedAt)}</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Origen</div>
                  <div className="receipt-field-value">{getZoneLabel(receipt.originZone)}</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Destino</div>
                  <div className="receipt-field-value">{getZoneLabel(receipt.destinationZone)}</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Servicio</div>
                  <div className="receipt-field-value">{getServiceLabel(receipt.serviceType)}</div>
                </div>
                <div className="receipt-field">
                  <div className="receipt-field-label">Estado</div>
                  <div className="receipt-field-value">
                    {receipt.orderStatus === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', marginTop: '1rem' }}>
                <strong>Paquetes: {receipt.packages.length}</strong>
                <p>Peso tarifable total: {receipt.breakdown.orderBillableKg.toFixed(2)} kg</p>
              </div>

              <div className="breakdown" style={{ marginTop: '1rem' }}>
                <div className="breakdown-row">
                  <span>Subtotal base:</span>
                  <span>{receipt.breakdown.baseSubtotalFormatted}</span>
                </div>
                <div className="breakdown-row">
                  <span>Servicio:</span>
                  <span>{receipt.breakdown.serviceSubtotalFormatted}</span>
                </div>
                {receipt.breakdown.fragileSurchargeCents > 0 && (
                  <div className="breakdown-row">
                    <span>Recargo frágil:</span>
                    <span>+ {receipt.breakdown.fragileSurchargeFormatted}</span>
                  </div>
                )}
                {receipt.breakdown.insuranceSurchargeCents > 0 && (
                  <div className="breakdown-row">
                    <span>Recargo seguro:</span>
                    <span>+ {receipt.breakdown.insuranceSurchargeFormatted}</span>
                  </div>
                )}
                {receipt.breakdown.discountAmountCents > 0 && (
                  <div className="breakdown-row">
                    <span>Descuento:</span>
                    <span>- {receipt.breakdown.discountAmountFormatted}</span>
                  </div>
                )}
              </div>

              <div className="receipt-total">
                <p>Total a Pagar</p>
                <div className="receipt-total-amount">{receipt.formattedTotal}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default OrderDetail
