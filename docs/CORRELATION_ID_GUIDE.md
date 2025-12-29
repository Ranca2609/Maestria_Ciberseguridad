# 🚀 Guía Rápida: Cómo Obtener y Usar el Correlation ID

## ¿Qué es el Correlation ID?

El **Correlation ID** es un identificador único (UUID) que se genera automáticamente para **cada request** que llega al Gateway. Este ID permite rastrear todo el flujo de una petición específica a través de todos los microservicios.

---

## 📍 Dónde Obtener el Correlation ID

### Opción 1: Desde el Response Header (Recomendado)

Cuando haces cualquier request al Gateway, el Correlation ID viene en el **header de respuesta** `X-Correlation-ID`:

#### Con curl:
```bash
curl -v http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "originZone": "METRO",
    "destinationZone": "INTERIOR",
    "serviceType": "EXPRESS",
    "packages": [{
      "weightKg": 5,
      "heightCm": 30,
      "widthCm": 20,
      "lengthCm": 40,
      "fragile": false,
      "declaredValueQ": 100
    }],
    "insuranceEnabled": false
  }'
```

**Busca en la salida:**
```
< X-Correlation-ID: ef72a8f5-d749-4f32-b80e-db5966502f66
```

#### Con PowerShell:
```powershell
$response = Invoke-WebRequest `
  -Uri "http://localhost:3000/v1/orders" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ 
    "originZone": "METRO",
    "destinationZone": "INTERIOR",
    "serviceType": "EXPRESS",
    "packages": [{
      "weightKg": 5,
      "heightCm": 30,
      "widthCm": 20,
      "lengthCm": 40,
      "fragile": false,
      "declaredValueQ": 100
    }],
    "insuranceEnabled": false
  }' `
  -UseBasicParsing

# Obtener el Correlation ID
$correlationId = $response.Headers.'X-Correlation-ID'[0]
Write-Host "Correlation ID: $correlationId" -ForegroundColor Green
```

#### Con Postman:
1. Haz tu request a cualquier endpoint
2. Ve a la pestaña **Headers** en la respuesta
3. Busca el header `X-Correlation-ID`
4. Copia el valor (será algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

#### Con el Navegador (DevTools):
1. Abre las **DevTools** (F12)
2. Ve a la pestaña **Network**
3. Haz tu request desde el frontend
4. Click en el request en la lista
5. Ve a **Headers** → **Response Headers**
6. Busca `X-Correlation-ID`

---

### Opción 2: Desde los Logs de Elasticsearch

Si no guardaste el Correlation ID del header, puedes buscarlo en Elasticsearch:

```bash
# Ver los últimos logs y sus correlation IDs
curl -s "http://localhost:9200/quetzalship-logs-*/_search?size=10&sort=@timestamp:desc" | jq '.hits.hits[]._source | {correlationId, message, timestamp: .["@timestamp"]}'
```

O en **Kibana**:
1. Abre http://localhost:5601
2. Ve a **Discover**
3. Busca tus logs recientes
4. Copia el `correlationId` del log que te interesa

---

## 🔍 Cómo Usar el Correlation ID en Grafana

### Método 1: Búsqueda Manual en el Panel de Logs

1. **Abre Grafana:** http://localhost:3001
2. **Login:** admin / quetzalship
3. **Ve al Dashboard:** "QuetzalShip - Logs Avanzados"
4. **En el panel "Logs Recientes":**
   - Click en el ícono de **lupa** (search)
   - Escribe: `correlationId:"tu-correlation-id-aquí"`
   - Ejemplo: `correlationId:"ef72a8f5-d749-4f32-b80e-db5966502f66"`
5. **Ver resultados:** Verás TODOS los logs relacionados con ese request

### Método 2: Crear un Panel Personalizado

1. **En el Dashboard**, click en **Add** → **Visualization**
2. **Selecciona datasource:** Elasticsearch
3. **En la query:** 
   ```
   correlationId:"ef72a8f5-d749-4f32-b80e-db5966502f66"
   ```
4. **Selecciona:** Logs visualization
5. **Guarda** el panel

### Método 3: Usar Kibana para Búsquedas Avanzadas

1. **Abre Kibana:** http://localhost:5601
2. **Ve a Discover**
3. **En el search bar:**
   ```
   correlationId:"ef72a8f5-d749-4f32-b80e-db5966502f66"
   ```
4. **Filtra por servicio:**
   ```
   correlationId:"ef72a8f5-d749-4f32-b80e-db5966502f66" AND serviceName:gateway
   ```

---

## 📊 Ejemplo Completo: Rastreo End-to-End

### Paso 1: Crear una Orden

```powershell
$response = Invoke-WebRequest `
  -Uri "http://localhost:3000/v1/orders" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{ 
    "originZone": "METRO",
    "destinationZone": "FRONTERA",
    "serviceType": "SAME_DAY",
    "packages": [{
      "weightKg": 10,
      "heightCm": 50,
      "widthCm": 30,
      "lengthCm": 60,
      "fragile": true,
      "declaredValueQ": 500
    }],
    "insuranceEnabled": true
  }' `
  -UseBasicParsing

# Obtener Correlation ID
$correlationId = $response.Headers.'X-Correlation-ID'[0]
Write-Host "`nCorrelation ID: $correlationId" -ForegroundColor Green
Write-Host "Usa este ID en Grafana para rastrear esta orden`n" -ForegroundColor Yellow
```

**Output esperado:**
```
Correlation ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Usa este ID en Grafana para rastrear esta orden
```

### Paso 2: Buscar en Grafana

1. Abre: http://localhost:3001
2. Dashboard: "QuetzalShip - Logs Avanzados"
3. Panel "Logs Recientes" → Search: `correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`

### Paso 3: Analizar el Flujo

Verás logs como:
```
1. Incoming request (gateway)
2. Request completed (gateway)
3. Order created (orders)
4. Price calculated (pricing)
```

Todos con el mismo `correlationId`, mostrando el **flujo completo** del request.

---

## 🎯 Casos de Uso

### Debugging de Errores

Si un request falló:
1. Copia el Correlation ID del error
2. Búscalo en Grafana
3. Ve TODOS los logs de ese request
4. Identifica dónde falló exactamente

### Análisis de Performance

1. Busca un request lento
2. Usa su Correlation ID
3. Ve cuánto tiempo tomó cada microservicio
4. Identifica el cuello de botella

### Auditoría

1. Un cliente reporta un problema con una orden
2. Obtén el Correlation ID de su request
3. Rastrea todo lo que pasó con su orden
4. Genera un reporte completo

---

## ⚠️ Puntos Importantes

### El Correlation ID es único por request
- ✅ Cada request nuevo genera un nuevo Correlation ID
- ✅ El mismo Correlation ID se propaga a todos los microservicios
- ✅ Permite rastreo end-to-end

### Puedes proporcionar tu propio Correlation ID
Si quieres usar tu propio ID (útil para testing):

```bash
curl -v http://localhost:3000/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-Correlation-ID: mi-id-personalizado-123" \
  -d '{ ... }'
```

El Gateway usará tu ID en lugar de generar uno nuevo.

### El Correlation ID se propaga automáticamente
No necesitas hacer nada especial. El middleware del Gateway:
1. ✅ Genera el ID (o usa el que proporcionaste)
2. ✅ Lo incluye en todos los logs
3. ✅ Lo devuelve en el response header
4. ✅ Lo propaga a los microservicios (futuro)

---

## 📚 Queries Útiles en Grafana/Kibana

```
# Todos los logs de un correlation ID
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890"

# Solo errores de un correlation ID
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890" AND logLevel:error

# Solo logs del gateway de un correlation ID
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890" AND serviceName:gateway

# Requests lentos (más de 100ms)
duration:>100ms

# Errores HTTP 4xx de un correlation ID
correlationId:"a1b2c3d4-e5f6-7890-abcd-ef1234567890" AND httpStatus:4*
```

---

## 🔧 Troubleshooting

### No veo el header X-Correlation-ID
- Verifica que el Gateway esté usando el middleware actualizado
- Revisa los logs del Gateway: `docker logs quetzalship-gateway`

### El Correlation ID no aparece en los logs
- Verifica que Logstash esté extrayendo el campo
- Revisa la configuración del pipeline: `docker logs quetzalship-logstash`

### No encuentro logs en Grafana
- Verifica que Elasticsearch tenga datos: `curl http://localhost:9200/_cat/indices?v`
- Ajusta el rango de tiempo en Grafana (arriba derecha)

---

**Última actualización:** 26 de diciembre de 2025
