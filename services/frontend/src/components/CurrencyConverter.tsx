import { useState } from 'react';
import { apiService } from '../services/api.service';
import type { ConvertResponse, ExchangeRateResponse, GetRatesResponse } from '../types/fx.types';
import '../styles/currency-converter.css';

const CURRENCIES = ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'];

export function CurrencyConverter() {
  // Form state
  const [fromCurrency, setFromCurrency] = useState('GTQ');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState<string>('100');
  
  // Results state
  const [convertResult, setConvertResult] = useState<ConvertResponse | null>(null);
  const [rateResult, setRateResult] = useState<ExchangeRateResponse | null>(null);
  const [ratesResult, setRatesResult] = useState<GetRatesResponse | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'convert' | 'rate' | 'rates'>('convert');

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    setConvertResult(null);

    try {
      const result = await apiService.convertCurrency({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: parseFloat(amount),
      });
      setConvertResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir moneda');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRate = async () => {
    setLoading(true);
    setError(null);
    setRateResult(null);

    try {
      const result = await apiService.getExchangeRate({
        from_currency: fromCurrency,
        to_currency: toCurrency,
      });
      setRateResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener tasa');
    } finally {
      setLoading(false);
    }
  };

  const handleGetRates = async () => {
    setLoading(true);
    setError(null);
    setRatesResult(null);

    try {
      const targetCurrencies = CURRENCIES.filter(c => c !== fromCurrency);
      const result = await apiService.getRates({
        base_currency: fromCurrency,
        target_currencies: targetCurrencies,
      });
      setRatesResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener tasas múltiples');
    } finally {
      setLoading(false);
    }
  };

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const getProviderBadge = (provider: string) => {
    if (provider.includes('default')) return 'badge badge-warning';
    if (provider.includes('primary')) return 'badge badge-success';
    if (provider.includes('fallback')) return 'badge badge-info';
    return 'badge badge-secondary';
  };

  const getCacheBadge = (fromCache: boolean) => {
    return fromCache ? 'badge badge-cache' : 'badge badge-api';
  };

  return (
    <div className="currency-converter">
      <h1>🔄 Validación del Servicio FX</h1>
      
      <div className="converter-info">
        <p>
          <strong>Características:</strong> Dos APIs externas (ExchangeRate-API + FreeCurrency), 
          caché Redis con TTL, circuit breaker, retries con backoff exponencial, 
          degradación elegante (caché → primaria → fallback → tasas por defecto)
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'convert' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('convert')}
        >
          💱 Convertir Moneda
        </button>
        <button
          className={activeTab === 'rate' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('rate')}
        >
          📊 Obtener Tasa
        </button>
        <button
          className={activeTab === 'rates' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('rates')}
        >
          📈 Tasas Múltiples
        </button>
      </div>

      {/* Currency Selection */}
      <div className="currency-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fromCurrency">Desde</label>
            <select
              id="fromCurrency"
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="swap-button" 
            onClick={swapCurrencies}
            title="Intercambiar monedas"
          >
            ⇄
          </button>

          <div className="form-group">
            <label htmlFor="toCurrency">Hacia</label>
            <select
              id="toCurrency"
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTab === 'convert' && (
          <div className="form-group">
            <label htmlFor="amount">Monto</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
            />
          </div>
        )}

        <div className="form-actions">
          {activeTab === 'convert' && (
            <button 
              onClick={handleConvert} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '⏳ Convirtiendo...' : '💱 Convertir'}
            </button>
          )}
          {activeTab === 'rate' && (
            <button 
              onClick={handleGetRate} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '⏳ Obteniendo...' : '📊 Obtener Tasa'}
            </button>
          )}
          {activeTab === 'rates' && (
            <button 
              onClick={handleGetRates} 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '⏳ Obteniendo...' : '📈 Obtener Todas las Tasas'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-box">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {activeTab === 'convert' && convertResult && (
        <div className="result-box">
          <h2>✅ Resultado de Conversión</h2>
          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">Monto Original:</span>
              <span className="result-value">
                {convertResult.original_amount.toFixed(2)} {convertResult.from_currency}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Monto Convertido:</span>
              <span className="result-value highlight">
                {convertResult.converted_amount.toFixed(2)} {convertResult.to_currency}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Tasa de Cambio:</span>
              <span className="result-value">{convertResult.rate.toFixed(6)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Proveedor:</span>
              <span className={getProviderBadge(convertResult.provider)}>
                {convertResult.provider}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Origen:</span>
              <span className={getCacheBadge(convertResult.from_cache)}>
                {convertResult.from_cache ? '💾 Caché' : '🌐 API'}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Timestamp:</span>
              <span className="result-value timestamp">
                {new Date(convertResult.timestamp).toLocaleString('es-GT')}
              </span>
            </div>
          </div>
          
          {convertResult.from_cache && (
            <div className="cache-info">
              ℹ️ Esta tasa proviene de caché Redis. Prueba hacer otra conversión 
              después de 5 minutos para ver el caché expirar.
            </div>
          )}
        </div>
      )}

      {activeTab === 'rate' && rateResult && (
        <div className="result-box">
          <h2>✅ Tasa de Cambio</h2>
          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">Par de Monedas:</span>
              <span className="result-value">
                {rateResult.from_currency} → {rateResult.to_currency}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Tasa:</span>
              <span className="result-value highlight">{rateResult.rate.toFixed(6)}</span>
            </div>
            <div className="result-item">
              <span className="result-label">Proveedor:</span>
              <span className={getProviderBadge(rateResult.provider)}>
                {rateResult.provider}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Origen:</span>
              <span className={getCacheBadge(rateResult.from_cache)}>
                {rateResult.from_cache ? '💾 Caché' : '🌐 API'}
              </span>
            </div>
            <div className="result-item full-width">
              <span className="result-label">Timestamp:</span>
              <span className="result-value timestamp">
                {new Date(rateResult.timestamp).toLocaleString('es-GT')}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rates' && ratesResult && (
        <div className="result-box">
          <h2>✅ Tasas Múltiples (Base: {ratesResult.base_currency})</h2>
          <div className="rates-table">
            <table>
              <thead>
                <tr>
                  <th>Moneda</th>
                  <th>Tasa</th>
                  <th>Equivalencia</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ratesResult.rates).map(([currency, rate]) => (
                  <tr key={currency}>
                    <td><strong>{currency}</strong></td>
                    <td>{rate.toFixed(6)}</td>
                    <td>
                      1 {ratesResult.base_currency} = {rate.toFixed(2)} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="result-metadata">
            <div className="result-item">
              <span className="result-label">Proveedor:</span>
              <span className={getProviderBadge(ratesResult.provider)}>
                {ratesResult.provider}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Origen:</span>
              <span className={getCacheBadge(ratesResult.from_cache)}>
                {ratesResult.from_cache ? '💾 Caché' : '🌐 API'}
              </span>
            </div>
            <div className="result-item full-width">
              <span className="result-label">Timestamp:</span>
              <span className="result-value timestamp">
                {new Date(ratesResult.timestamp).toLocaleString('es-GT')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Testing Guide */}
      <div className="testing-guide">
        <h3>🧪 Guía de Pruebas</h3>
        <ul>
          <li>
            <strong>Caché:</strong> Haz la misma conversión dos veces seguidas. 
            La segunda debe mostrar "💾 Caché".
          </li>
          <li>
            <strong>Circuit Breaker:</strong> Si las APIs fallan, verás el proveedor 
            cambiar a "fallback" o "default rates".
          </li>
          <li>
            <strong>Degradación:</strong> El servicio prueba primero el caché, 
            luego la API primaria, luego la fallback, y finalmente tasas por defecto.
          </li>
          <li>
            <strong>TTL:</strong> El caché expira después de 5 minutos (300 segundos). 
            Espera y verás que la misma conversión vuelve a consultar la API.
          </li>
        </ul>
      </div>
    </div>
  );
}
