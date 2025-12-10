import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services';
import { Zone, ServiceType, DiscountType, Package, CreateOrderRequest } from '../types';

const initialPackage: Package = {
  weightKg: 1,
  heightCm: 10,
  widthCm: 10,
  lengthCm: 10,
  fragile: false,
  declaredValueQ: 0,
};

export function CreateOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateOrderRequest>({
    originZone: Zone.METRO,
    destinationZone: Zone.METRO,
    serviceType: ServiceType.STANDARD,
    packages: [{ ...initialPackage }],
    discount: { type: DiscountType.NONE, value: 0 },
    insuranceEnabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiService.createOrder(formData);
      setSuccess(`Orden creada exitosamente. ID: ${result.orderId}, Total: Q${result.total.toFixed(2)}`);
      setTimeout(() => navigate(`/orders/${result.orderId}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la orden');
    } finally {
      setLoading(false);
    }
  };

  const addPackage = () => {
    setFormData({
      ...formData,
      packages: [...formData.packages, { ...initialPackage }],
    });
  };

  const removePackage = (index: number) => {
    if (formData.packages.length > 1) {
      setFormData({
        ...formData,
        packages: formData.packages.filter((_, i) => i !== index),
      });
    }
  };

  const updatePackage = (index: number, field: keyof Package, value: number | boolean) => {
    const newPackages = [...formData.packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setFormData({ ...formData, packages: newPackages });
  };

  return (
    <div className="card">
      <h2>Crear Nueva Orden</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Zona de Origen</label>
            <select
              value={formData.originZone}
              onChange={(e) => setFormData({ ...formData, originZone: e.target.value as Zone })}
            >
              <option value={Zone.METRO}>Metropolitana</option>
              <option value={Zone.INTERIOR}>Interior</option>
              <option value={Zone.FRONTERA}>Frontera</option>
            </select>
          </div>

          <div className="form-group">
            <label>Zona de Destino</label>
            <select
              value={formData.destinationZone}
              onChange={(e) => setFormData({ ...formData, destinationZone: e.target.value as Zone })}
            >
              <option value={Zone.METRO}>Metropolitana</option>
              <option value={Zone.INTERIOR}>Interior</option>
              <option value={Zone.FRONTERA}>Frontera</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Servicio</label>
            <select
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
            >
              <option value={ServiceType.STANDARD}>Estándar (x1.0)</option>
              <option value={ServiceType.EXPRESS}>Express (x1.35)</option>
              <option value={ServiceType.SAME_DAY}>Mismo Día (x1.8)</option>
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: 20, marginBottom: 10 }}>Paquetes</h3>
        {formData.packages.map((pkg, index) => (
          <div key={index} className="package-card">
            <h4>
              Paquete {index + 1}
              {formData.packages.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: 10 }}
                  onClick={() => removePackage(index)}
                >
                  Eliminar
                </button>
              )}
            </h4>
            <div className="form-row">
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  value={pkg.weightKg}
                  onChange={(e) => updatePackage(index, 'weightKg', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Alto (cm)</label>
                <input
                  type="number"
                  min="0.01"
                  value={pkg.heightCm}
                  onChange={(e) => updatePackage(index, 'heightCm', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Ancho (cm)</label>
                <input
                  type="number"
                  min="0.01"
                  value={pkg.widthCm}
                  onChange={(e) => updatePackage(index, 'widthCm', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Largo (cm)</label>
                <input
                  type="number"
                  min="0.01"
                  value={pkg.lengthCm}
                  onChange={(e) => updatePackage(index, 'lengthCm', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Valor Declarado (Q)</label>
                <input
                  type="number"
                  min="0"
                  value={pkg.declaredValueQ}
                  onChange={(e) => updatePackage(index, 'declaredValueQ', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id={`fragile-${index}`}
                  checked={pkg.fragile}
                  onChange={(e) => updatePackage(index, 'fragile', e.target.checked)}
                />
                <label htmlFor={`fragile-${index}`}>Frágil (+Q7)</label>
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addPackage}>
          + Agregar Paquete
        </button>

        <h3 style={{ marginTop: 20, marginBottom: 10 }}>Opciones</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Descuento</label>
            <select
              value={formData.discount?.type || DiscountType.NONE}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount: { type: e.target.value as DiscountType, value: formData.discount?.value || 0 },
                })
              }
            >
              <option value={DiscountType.NONE}>Sin descuento</option>
              <option value={DiscountType.PERCENT}>Porcentaje (máx 35%)</option>
              <option value={DiscountType.FIXED}>Monto Fijo (Q)</option>
            </select>
          </div>

          {formData.discount?.type !== DiscountType.NONE && (
            <div className="form-group">
              <label>Valor del Descuento</label>
              <input
                type="number"
                min="0"
                max={formData.discount?.type === DiscountType.PERCENT ? 35 : undefined}
                value={formData.discount?.value || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: { type: formData.discount!.type, value: parseFloat(e.target.value) || 0 },
                  })
                }
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="insurance"
              checked={formData.insuranceEnabled}
              onChange={(e) => setFormData({ ...formData, insuranceEnabled: e.target.checked })}
            />
            <label htmlFor="insurance">Habilitar Seguro (2.5% del valor declarado)</label>
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      </form>
    </div>
  );
}
