import { useState } from 'react'
import { api, ZONES, SERVICE_TYPES, DISCOUNT_TYPES } from '../services/api'

const emptyPackage = {
  weightKg: '',
  heightCm: '',
  widthCm: '',
  lengthCm: '',
  fragile: false,
  declaredValueCents: '',
}

function CreateOrder({ onOrderCreated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [originZone, setOriginZone] = useState(ZONES.METRO.value)
  const [destinationZone, setDestinationZone] = useState(ZONES.INTERIOR.value)
  const [serviceType, setServiceType] = useState(SERVICE_TYPES.STANDARD.value)
  const [insuranceEnabled, setInsuranceEnabled] = useState(false)
  const [discountType, setDiscountType] = useState(DISCOUNT_TYPES.NONE.value)
  const [discountValue, setDiscountValue] = useState('')
  const [packages, setPackages] = useState([{ ...emptyPackage }])

  const addPackage = () => {
    setPackages([...packages, { ...emptyPackage }])
  }

  const removePackage = (index) => {
    if (packages.length > 1) {
      setPackages(packages.filter((_, i) => i !== index))
    }
  }

  const updatePackage = (index, field, value) => {
    const updated = [...packages]
    updated[index] = { ...updated[index], [field]: value }
    setPackages(updated)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const orderData = {
        originZone: parseInt(originZone),
        destinationZone: parseInt(destinationZone),
        serviceType: parseInt(serviceType),
        insuranceEnabled,
        discount: {
          type: parseInt(discountType),
          value: discountType === DISCOUNT_TYPES.NONE.value
            ? 0
            : discountType === DISCOUNT_TYPES.PERCENT.value
              ? parseInt(discountValue) || 0
              : parseInt(discountValue) * 100 || 0,
        },
        packages: packages.map(pkg => ({
          weightKg: parseFloat(pkg.weightKg) || 0,
          heightCm: parseFloat(pkg.heightCm) || 0,
          widthCm: parseFloat(pkg.widthCm) || 0,
          lengthCm: parseFloat(pkg.lengthCm) || 0,
          fragile: pkg.fragile,
          declaredValueCents: parseInt(parseFloat(pkg.declaredValueCents || 0) * 100),
        })),
      }

      const result = await api.createOrder(orderData)
      setSuccess(`Orden creada exitosamente. ID: ${result.orderId}`)

      // Reset form
      setPackages([{ ...emptyPackage }])
      setDiscountValue('')
      setDiscountType(DISCOUNT_TYPES.NONE.value)
      setInsuranceEnabled(false)

      setTimeout(() => {
        onOrderCreated()
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Crear Nueva Orden</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <h3>Información del envío</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Zona de Origen</label>
            <select
              value={originZone}
              onChange={(e) => setOriginZone(e.target.value)}
              required
            >
              {Object.entries(ZONES).map(([key, { value, label }]) => (
                <option key={key} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Zona de Destino</label>
            <select
              value={destinationZone}
              onChange={(e) => setDestinationZone(e.target.value)}
              required
            >
              {Object.entries(ZONES).map(([key, { value, label }]) => (
                <option key={key} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tipo de Servicio</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            >
              {Object.entries(SERVICE_TYPES).map(([key, { value, label }]) => (
                <option key={key} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>Paquetes</h3>
        {packages.map((pkg, index) => (
          <div key={index} className="package-item">
            <div className="package-header">
              <span className="package-number">Paquete {index + 1}</span>
              {packages.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removePackage(index)}
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pkg.weightKg}
                  onChange={(e) => updatePackage(index, 'weightKg', e.target.value)}
                  placeholder="Ej: 5.5"
                  required
                />
              </div>

              <div className="form-group">
                <label>Alto (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pkg.heightCm}
                  onChange={(e) => updatePackage(index, 'heightCm', e.target.value)}
                  placeholder="Ej: 30"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ancho (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pkg.widthCm}
                  onChange={(e) => updatePackage(index, 'widthCm', e.target.value)}
                  placeholder="Ej: 20"
                  required
                />
              </div>

              <div className="form-group">
                <label>Largo (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pkg.lengthCm}
                  onChange={(e) => updatePackage(index, 'lengthCm', e.target.value)}
                  placeholder="Ej: 15"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Valor Declarado (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pkg.declaredValueCents}
                  onChange={(e) => updatePackage(index, 'declaredValueCents', e.target.value)}
                  placeholder="Ej: 500.00"
                />
              </div>

              <div className="form-group">
                <label>&nbsp;</label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={pkg.fragile}
                    onChange={(e) => updatePackage(index, 'fragile', e.target.checked)}
                  />
                  Paquete frágil (+Q7.00)
                </label>
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addPackage}>
          + Agregar paquete
        </button>

        <h3 style={{ marginTop: '1.5rem' }}>Opciones adicionales</h3>
        <div className="form-row">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={insuranceEnabled}
                onChange={(e) => setInsuranceEnabled(e.target.checked)}
              />
              Habilitar seguro (2.5% del valor declarado)
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Descuento</label>
            <select
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value)
                setDiscountValue('')
              }}
            >
              {Object.entries(DISCOUNT_TYPES).map(([key, { value, label }]) => (
                <option key={key} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {discountType !== DISCOUNT_TYPES.NONE.value && (
            <div className="form-group">
              <label>
                {discountType === DISCOUNT_TYPES.PERCENT.value
                  ? 'Porcentaje (máx 35%)'
                  : 'Monto (Q)'}
              </label>
              <input
                type="number"
                step={discountType === DISCOUNT_TYPES.PERCENT.value ? '1' : '0.01'}
                min="0"
                max={discountType === DISCOUNT_TYPES.PERCENT.value ? '35' : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === DISCOUNT_TYPES.PERCENT.value ? 'Ej: 10' : 'Ej: 50.00'}
              />
            </div>
          )}
        </div>

        <div className="btn-group" style={{ marginTop: '1.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Orden'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateOrder
