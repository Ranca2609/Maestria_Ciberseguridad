# Corrección: Servicio FX con Fallback cuando está Caído

## Problema Identificado

Cuando detienes el servicio FX en Docker, el gateway **NO** puede acceder a las tasas de cambio cacheadas en Redis porque:

### ❌ Arquitectura Anterior

```
Frontend → Gateway → FX Service → Redis
                ↓
              FALLA (FX caído)
              ↓
            ERROR 500
```

**Problemas**:

1. El **Gateway** no tiene acceso directo a Redis
2. El **Gateway** solo se comunica con FX vía gRPC
3. Cuando FX está caído, el gRPC falla inmediatamente
4. **NO hay fallback** - la aplicación se rompe completamente

### ✅ Arquitectura Corregida

```
Frontend → Gateway → FX Service (intentar)
                ↓
              FALLA?
                ↓
           Usar tasas por defecto
                ↓
           Respuesta exitosa con warning
```

## Solución Implementada

### 1. **Fallback a Tasas por Defecto en el Gateway**

Agregado manejo de errores robusto en `services/gateway/src/services/fx.service.ts`:

```typescript
// Tasas por defecto cuando FX está caído
const DEFAULT_RATES: Record<string, number> = {
  GTQ: 7.8,
  EUR: 0.92,
  GBP: 0.79,
  MXN: 17.2,
  USD: 1.0,
  CAD: 1.35,
  JPY: 149.5,
};
```

### 2. **Timeout de 5 Segundos**

```typescript
private readonly FX_TIMEOUT_MS = 5000;
```

- Si FX no responde en 5 segundos, usa fallback
- Evita que el usuario espere indefinidamente

### 3. **Try-Catch con Fallback**

Para cada método (`convert`, `getExchangeRate`, `getRates`):

```typescript
try {
  // Intentar conectar con FX service
  const result = await firstValueFrom(
    this.fxService.getExchangeRate({ fromCurrency, toCurrency }).pipe(
      timeout(this.FX_TIMEOUT_MS),
      catchError((error) => {
        this.logger.warn(`FX service unavailable: ${error.message}`);
        throw error;
      })
    )
  );
  return result; // ✅ Respuesta del servicio FX
} catch (error) {
  // ✅ FALLBACK: Usar tasas por defecto
  const rate = this.getDefaultRate(fromCurrency, toCurrency);

  return {
    from_currency: fromCurrency.toUpperCase(),
    to_currency: toCurrency.toUpperCase(),
    rate: rate,
    provider: "DEFAULT (FX service unavailable)", // ⚠️ Indica que es fallback
    from_cache: false,
    timestamp: new Date().toISOString(),
  };
}
```

### 4. **Cálculo Inteligente de Tasas Cruzadas**

```typescript
private getDefaultRate(from: string, to: string): number {
  // Mismo currency
  if (from === to) return 1.0;

  // Conversión directa desde USD
  if (from === 'USD' && DEFAULT_RATES[to]) {
    return DEFAULT_RATES[to];
  }

  // Conversión directa a USD
  if (to === 'USD' && DEFAULT_RATES[from]) {
    return 1 / DEFAULT_RATES[from];
  }

  // Tasa cruzada vía USD (ej: EUR → GTQ)
  if (DEFAULT_RATES[from] && DEFAULT_RATES[to]) {
    return DEFAULT_RATES[to] / DEFAULT_RATES[from];
  }

  // Último recurso
  return 1.0;
}
```

## Comportamiento Nuevo

### Escenario 1: FX Service Funcionando ✅

```json
{
  "from_currency": "USD",
  "to_currency": "GTQ",
  "rate": 7.82,
  "provider": "ExchangeRate-API (cached)",
  "from_cache": true,
  "timestamp": "2025-12-28T21:30:00Z"
}
```

### Escenario 2: FX Service Caído ⚠️

```json
{
  "from_currency": "USD",
  "to_currency": "GTQ",
  "rate": 7.8,
  "provider": "DEFAULT (FX service unavailable)",
  "from_cache": false,
  "timestamp": "2025-12-28T21:35:00Z"
}
```

**Ventajas**:

- ✅ La aplicación **NO se rompe**
- ✅ El usuario obtiene una tasa razonable
- ✅ El campo `provider` indica claramente que es fallback
- ✅ Los logs muestran warnings para debugging

## Por Qué Redis No Es Suficiente

### Problema Original

```
FX Service caído → Redis tiene caché → Gateway NO puede acceder
```

**Razones**:

1. El Gateway se comunica con FX vía **gRPC**, no directamente con Redis
2. Cuando FX está caído, la **conexión gRPC falla**
3. Redis es **interno al servicio FX**, no expuesto al Gateway

### Solución Alternativa (NO Implementada)

Podrías hacer que el Gateway acceda directamente a Redis:

```typescript
// Gateway tendría que:
1. Conectarse a Redis
2. Conocer el formato de las claves (fx:rate:USD:GTQ)
3. Parsear los datos cacheados
4. Manejar TTL expirado
```

**Desventajas**:

- ❌ Acoplamiento fuerte entre Gateway y FX
- ❌ Duplicación de lógica de caché
- ❌ Violación de responsabilidades (Gateway no debería conocer Redis)

### Solución Implementada (Mejor)

**Fallback a tasas por defecto**:

- ✅ Desacoplado - Gateway no depende de Redis
- ✅ Simple - Solo necesita tasas hardcodeadas
- ✅ Resiliente - Funciona incluso si Redis también está caído
- ✅ Mantenible - Tasas por defecto en un solo lugar

## Pruebas

### 1. Con FX Service Funcionando

```bash
# Verificar que FX está corriendo
docker compose -f docker-compose.local.yml ps fx

# Probar endpoint
curl http://localhost:3000/api/v1/fx/rates?from=USD&to=GTQ
```

**Resultado esperado**:

```json
{
  "provider": "ExchangeRate-API" // o "cached"
}
```

### 2. Con FX Service Detenido

```bash
# Detener FX
docker compose -f docker-compose.local.yml stop fx

# Probar endpoint (debería funcionar con fallback)
curl http://localhost:3000/api/v1/fx/rates?from=USD&to=GTQ
```

**Resultado esperado**:

```json
{
  "provider": "DEFAULT (FX service unavailable)",
  "rate": 7.8
}
```

### 3. Verificar Logs

```bash
docker compose -f docker-compose.local.yml logs gateway --tail 50
```

**Deberías ver**:

```
[Gateway] FX service unavailable: Connection refused
[Gateway] Using default rate for USD → GTQ: 7.8
```

## Tasas por Defecto Incluidas

| Moneda | Tasa vs USD | Fuente               |
| ------ | ----------- | -------------------- |
| GTQ    | 7.8         | Quetzal Guatemalteco |
| EUR    | 0.92        | Euro                 |
| GBP    | 0.79        | Libra Esterlina      |
| MXN    | 17.2        | Peso Mexicano        |
| USD    | 1.0         | Dólar (base)         |
| CAD    | 1.35        | Dólar Canadiense     |
| JPY    | 149.5       | Yen Japonés          |

**Nota**: Estas tasas son aproximadas y deberían actualizarse periódicamente.

## Recomendaciones Adicionales

### Opción 1: Actualizar Tasas por Defecto Periódicamente

```typescript
// Agregar script que actualice DEFAULT_RATES cada semana
// desde una fuente confiable
```

### Opción 2: Caché Local en el Gateway

```typescript
// Implementar un caché en memoria en el Gateway
// que guarde las últimas tasas exitosas
private lastKnownRates: Map<string, RateData> = new Map();
```

### Opción 3: Circuit Breaker

```typescript
// Agregar circuit breaker para FX service
// Si falla X veces, usar fallback automáticamente por Y tiempo
```

## Archivos Modificados

- `services/gateway/src/services/fx.service.ts` - Agregado fallback y manejo de errores

## Resumen

✅ **Problema resuelto**: Cuando FX está caído, el Gateway ahora usa tasas por defecto en lugar de fallar

✅ **Degradación graceful**: La aplicación sigue funcionando con tasas razonables

✅ **Transparencia**: El campo `provider` indica claramente cuando se usan tasas por defecto

✅ **Logs**: Warnings claros para debugging

---
