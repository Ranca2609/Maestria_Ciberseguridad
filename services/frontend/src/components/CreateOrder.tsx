import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services';
import { Zone, ServiceType, DiscountType, Package, CreateOrderRequest } from '../types';

const CURRENCIES = ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'];

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

  // FX State
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [convertedTotal, setConvertedTotal] = useState<number | null>(null);
  const [fxProvider, setFxProvider] = useState<string>('');
  const [fxFromCache, setFxFromCache] = useState<boolean>(false);
  const [fxLoading, setFxLoading] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState<number>(0);

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

  // Calculate estimated total
  useEffect(() => {
    const calculateEstimate = () => {
      let total = 0;
      
      // Base rate calculation (simplified)
      formData.packages.forEach(pkg => {
        const volumetricWeight = (pkg.lengthCm * pkg.widthCm * pkg.heightCm) / 5000;
        const chargeableWeight = Math.max(pkg.weightKg, volumetricWeight);
        
        // Base rate per kg (simplified, real calculation is in backend)
        let baseRate = 15; // Q15 per kg base
        
        // Zone multipliers
        if (formData.destinationZone === Zone.INTERIOR) baseRate *= 1.5;
        if (formData.destinationZone === Zone.FRONTERA) baseRate *= 2.0;
        
        // Service multipliers
        if (formData.serviceType === ServiceType.EXPRESS) baseRate *= 1.35;
        if (formData.serviceType === ServiceType.SAME_DAY) baseRate *= 1.8;
        
        total += chargeableWeight * baseRate;
        
        // Fragile surcharge
        if (pkg.fragile) total += 7;
        
        // Insurance
        if (formData.insuranceEnabled && pkg.declaredValueQ > 0) {
          total += pkg.declaredValueQ * 0.025;
        }
      });
      
      // Discount
      if (formData.discount?.type === DiscountType.PERCENT) {
        total -= total * (Math.min(formData.discount.value, 35) / 100);
      } else if (formData.discount?.type === DiscountType.FIXED) {
        total -= formData.discount.value;
      }
      
      setEstimatedTotal(Math.max(0, total));
    };
    
    calculateEstimate();
  }, [formData]);

  // Get exchange rate when currency changes or estimated total changes
  useEffect(() => {
    const getExchangeRate = async () => {
      if (selectedCurrency === 'GTQ' || estimatedTotal === 0) {
        setExchangeRate(null);
        setConvertedTotal(null);
        return;
      }

      setFxLoading(true);
      try {
        const result = await apiService.convertCurrency({
          from_currency: 'GTQ',
          to_currency: selectedCurrency,
          amount: estimatedTotal,
        });
        
        setExchangeRate(result.rate);
        setConvertedTotal(result.converted_amount);
        setFxProvider(result.provider);
        setFxFromCache(result.from_cache);
      } catch (err) {
        console.error('Error getting exchange rate:', err);
        setExchangeRate(null);
        setConvertedTotal(null);
      } finally {
        setFxLoading(false);
      }
    };

    getExchangeRate();
  }, [selectedCurrency, estimatedTotal]);

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

      {/* FX Conversion Panel */}
      {estimatedTotal > 0 && (
        <div className="fx-panel" style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #e9ecef' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>💱 Conversión de Moneda (Estimado)</h3>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#374151' }}>
                Total Estimado (GTQ)
              </label>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
                Q{estimatedTotal.toFixed(2)}
              </div>
            </div>

            <div style={{ fontSize: '2rem', color: '#6b7280' }}>→</div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600, color: '#374151' }}>
                Convertir a
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #e5e7eb', fontSize: '1rem' }}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCurrency !== 'GTQ' && (
            <>
              {fxLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                  ⏳ Obteniendo tasa de cambio...
                </div>
              ) : convertedTotal !== null && exchangeRate !== null ? (
                <div style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>
                        TOTAL CONVERTIDO
                      </div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669' }}>
                        {convertedTotal.toFixed(2)} {selectedCurrency}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>
                        TASA DE CAMBIO
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
                        {exchangeRate.toFixed(6)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        1 GTQ = {exchangeRate.toFixed(4)} {selectedCurrency}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>
                        PROVEEDOR
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: fxProvider.includes('primary') ? '#d1fae5' : fxProvider.includes('fallback') ? '#dbeafe' : '#fef3c7',
                        color: fxProvider.includes('primary') ? '#065f46' : fxProvider.includes('fallback') ? '#1e40af' : '#92400e'
                      }}>
                        {fxProvider}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '5px' }}>
                        ORIGEN
                      </div>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        background: fxFromCache ? '#e0e7ff' : '#ecfccb',
                        color: fxFromCache ? '#3730a3' : '#3f6212'
                      }}>
                        {fxFromCache ? '💾 Caché' : '🌐 API'}
                      </span>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    background: '#eff6ff', 
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#1e40af'
                  }}>
                    ℹ️ Esta conversión es un estimado. El total exacto se calculará al crear la orden.
                    {fxFromCache && ' La tasa proviene de caché Redis (TTL: 5 min).'}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>
                  ❌ Error al obtener la tasa de cambio
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
