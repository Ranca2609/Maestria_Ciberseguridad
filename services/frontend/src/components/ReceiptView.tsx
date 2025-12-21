import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services';
import { Receipt } from '../types';
import { ReceiptResponse } from '../types/receipt.types';

export function ReceiptView() {
  const { orderId } = useParams<{ orderId: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadReceipt();
    }
  }, [orderId]);

// En loadReceipt:
const loadReceipt = async () => {
  setLoading(true);
  setError(null);
  try {
    const result: ReceiptResponse = await apiService.getReceipt(orderId!); // ✅ tipado explícito

    // ✅ Ahora TypeScript sabe que `result.content` existe
    const mappedReceipt: Receipt = {
      receiptId: result.receiptId,
      orderId: result.orderId,
      generatedAt: result.generatedAt,
      status: result.content.status, // ← string, no número
      originZone: result.content.originZone,
      destinationZone: result.content.destinationZone,
      serviceType: result.content.serviceType,
      packagesCount: result.content.packagesCount,
      lines: result.content.lines,
      subtotal: result.content.subtotal,
      discount: result.content.discount,
      total: result.content.total,
      insuranceEnabled: result.content.insuranceEnabled,
      declaredValue: result.content.declaredValue,
    };

    setReceipt(mappedReceipt);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al cargar el recibo');
  } finally {
    setLoading(false);
  }
};
  if (loading) {
    return <div className="loading">Generando recibo...</div>;
  }

  if (error || !receipt) {
    return (
      <div className="card">
        <div className="alert alert-error">{error || 'Recibo no encontrado'}</div>
        <Link to="/orders" className="back-link">← Volver a la lista</Link>
      </div>
    );
  }

  return (
    <div className="card">
      <Link to={`/orders/${orderId}`} className="back-link">← Volver al detalle</Link>

      <div className="receipt">
        <div className="receipt-header">
          <h2>QuetzalShip</h2>
          <p>Sistema de Envíos</p>
          <hr />
          <h3>RECIBO DE ORDEN</h3>
          <p><strong>Recibo:</strong> {receipt.receiptId}</p>
          <p><strong>Orden:</strong> {receipt.orderId}</p>
          <p><strong>Fecha:</strong> {new Date(receipt.generatedAt).toLocaleString()}</p>
          <p><strong>Estado:</strong> {receipt.status}</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4>Información del Envío</h4>
          <table className="breakdown-table">
            <tbody>
              <tr>
                <td>Origen:</td>
                <td>{receipt.originZone}</td>
              </tr>
              <tr>
                <td>Destino:</td>
                <td>{receipt.destinationZone}</td>
              </tr>
              <tr>
                <td>Servicio:</td>
                <td>{receipt.serviceType}</td>
              </tr>
              <tr>
                <td>Paquetes:</td>
                <td>{receipt.packagesCount}</td>
              </tr>
              {receipt.insuranceEnabled && (
                <tr>
                  <td>Valor asegurado:</td>
                  <td>Q{receipt.declaredValue.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h4>Desglose de Costos</h4>
          <table className="breakdown-table">
            <tbody>
              {receipt.lines.map((line, index) => (
                <tr key={index}>
                  <td>{line.description}</td>
                  <td style={{ color: line.amount < 0 ? '#dc3545' : undefined }}>
                    {line.amount < 0 ? '-' : ''}Q{Math.abs(line.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td>SUBTOTAL:</td>
                <td>Q{receipt.subtotal.toFixed(2)}</td>
              </tr>
              {receipt.discount > 0 && (
                <tr style={{ color: '#dc3545' }}>
                  <td>DESCUENTO:</td>
                  <td>-Q{receipt.discount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="total" style={{ fontSize: '1.2em' }}>
                <td>TOTAL A PAGAR:</td>
                <td>Q{receipt.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'center', marginTop: 30, paddingTop: 20, borderTop: '1px dashed #ccc' }}>
          <p>¡Gracias por usar QuetzalShip!</p>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            Este recibo fue generado automáticamente.
          </p>
        </div>
      </div>

      <div className="actions" style={{ marginTop: 20 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Imprimir Recibo
        </button>
        <Link to="/orders" className="btn btn-secondary">
          Volver a Órdenes
        </Link>
      </div>
    </div>
  );
}
