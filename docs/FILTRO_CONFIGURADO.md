# ✅ Filtro de Correlation ID - CONFIGURADO

## 🎉 Estado Actual

El dashboard de Grafana ahora tiene un **campo de filtro** para Correlation ID que permite:

✅ Ver TODOS los logs (campo vacío)  
✅ Filtrar por un Correlation ID específico  
✅ Rastrear un request end-to-end  
✅ Combinar con otros filtros (nivel, servicio)

---

## 🚀 Cómo Usarlo (Paso a Paso)

### 1. Obtén un Correlation ID

```powershell
.\scripts\get-correlation-id.ps1
```

**Output:**
```
╔═══════════════════════════════════════════════════════╗
║           CORRELATION ID                              ║
╠═══════════════════════════════════════════════════════╣
║  57c7b17a-f70c-4cba-9a9b-b5e0103663df  ║
╚═══════════════════════════════════════════════════════╝

💡 Copiado al portapapeles!
```

### 2. Abre Grafana

- **URL:** http://localhost:3001
- **Usuario:** `admin`
- **Contraseña:** `quetzalship`

### 3. Ve al Dashboard

- Menú izquierdo → **Dashboards**
- Selecciona: **"QuetzalShip - Logs Avanzados"**

### 4. Usa el Filtro

En la **parte superior** del dashboard verás:

```
Correlation ID: [                                          ]
                 ▲
                 └── Pega aquí el ID (Ctrl+V)
```

**Opciones:**

#### A) Dejar vacío = Ver TODOS los logs
```
Correlation ID: [         ]
```

#### B) Pegar solo el UUID
```
Correlation ID: [57c7b17a-f70c-4cba-9a9b-b5e0103663df]
```

#### C) Usar sintaxis Lucene (RECOMENDADO)
```
Correlation ID: [correlationId:"57c7b17a-f70c-4cba-9a9b-b5e0103663df"]
```

### 5. Ver Resultados

El panel **"Logs Recientes (Filtrados)"** mostrará:

✅ Solo los logs con ese Correlation ID  
✅ Flujo completo: Gateway → Orders → Pricing → Receipt  
✅ Timestamps en orden cronológico

---

## 📊 Paneles del Dashboard

| Panel | ¿Se filtra por Correlation ID? | Descripción |
|-------|-------------------------------|-------------|
| **Errores Totales** | ❌ No | Cuenta global de errores |
| **Logs por Nivel** | ❌ No | Gráfico temporal info/warn/error |
| **Errores por Servicio** | ❌ No | Barras por servicio |
| **Distribución** | ❌ No | Pie chart por servicio |
| **Logs Recientes (Filtrados)** | ✅ **SÍ** | Logs detallados filtrados |

**Solo el último panel usa el filtro de Correlation ID.**

---

## 🎯 Ejemplos de Filtros Avanzados

### Ver solo errores de un request:
```
correlationId:"57c7b17a-f70c-4cba-9a9b-b5e0103663df" AND logLevel:error
```

### Ver solo logs del Gateway de un request:
```
correlationId:"57c7b17a-f70c-4cba-9a9b-b5e0103663df" AND serviceName:gateway
```

### Ver requests con duración >100ms:
```
correlationId:"57c7b17a-f70c-4cba-9a9b-b5e0103663df" AND duration:>100ms
```

### Ver códigos HTTP 4xx:
```
correlationId:"57c7b17a-f70c-4cba-9a9b-b5e0103663df" AND httpStatus:4*
```

---

## ✅ Verificación

Para verificar que todo funciona:

### 1. Genera logs:
```powershell
.\scripts\get-correlation-id.ps1
```

### 2. Verifica en Elasticsearch:
```powershell
$body = @'
{
  "query": {
    "match": {
      "correlationId": "57c7b17a-f70c-4cba-9a9b-b5e0103663df"
    }
  },
  "size": 5
}
'@

Invoke-RestMethod -Uri "http://localhost:9200/quetzalship-logs-*/_search" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**Resultado esperado:** Al menos 2 logs (Incoming request + Request completed)

### 3. Verifica en Grafana:
1. Abre: http://localhost:3001
2. Dashboard: "QuetzalShip - Logs Avanzados"
3. Pega el Correlation ID en el campo de texto
4. Presiona Enter
5. ✅ Deberías ver los logs filtrados en "Logs Recientes (Filtrados)"

---

## 🛠️ Troubleshooting

### ❌ El campo "Correlation ID" no aparece en el dashboard

**Solución:**
```powershell
# Reiniciar Grafana
docker restart quetzalship-grafana

# Esperar 10 segundos
Start-Sleep -Seconds 10

# Refrescar el navegador (F5)
```

### ❌ El filtro no muestra nada

**Posibles causas:**

1. **Correlation ID incorrecto:**
   - Verifica que sea el UUID completo
   - Verifica que no haya espacios extras
   - Prueba con: `correlationId:"tu-id-completo"`

2. **Rango de tiempo incorrecto:**
   - En Grafana (arriba derecha), cambia a "Last 15 minutes"
   - O ajusta a "Last 1 hour"

3. **El log no existe en Elasticsearch:**
   ```powershell
   # Verifica que exista
   curl "http://localhost:9200/quetzalship-logs-*/_search?q=correlationId:TU-ID&size=1"
   ```

### ❌ Los logs muestran todo (no se filtran)

**Solución:**
- Asegúrate de presionar **Enter** después de pegar el ID
- El campo usa la variable `$correlationId`
- Si dejas el campo vacío, mostrará todos los logs (esto es normal)

---

## 📚 Documentación Relacionada

- 📖 **Guía completa de filtrado:** [GRAFANA_FILTER_GUIDE.md](GRAFANA_FILTER_GUIDE.md)
- 🔍 **Cómo obtener Correlation ID:** [CORRELATION_ID_GUIDE.md](CORRELATION_ID_GUIDE.md)
- 📊 **Layout del dashboard:** [DASHBOARD_LAYOUT.txt](DASHBOARD_LAYOUT.txt)
- 🏗️ **Arquitectura de observabilidad:** [OBSERVABILITY.md](OBSERVABILITY.md)

---

## 🔄 Cambios Realizados

### Archivo modificado: `docker/grafana/provisioning/dashboards/quetzalship-advanced-logs.json`

1. **Agregada variable de dashboard:**
   ```json
   {
     "templating": {
       "list": [
         {
           "name": "correlationId",
           "type": "textbox",
           "label": "Correlation ID",
           "description": "Filtrar logs por Correlation ID (UUID del request)"
         }
       ]
     }
   }
   ```

2. **Modificado panel "Logs Recientes (Filtrados)":**
   ```json
   {
     "query": "$correlationId",  // <-- Usa la variable
     "refId": "A"
   }
   ```

### Cambios aplicados:
```powershell
docker restart quetzalship-grafana
```

---

## 🎓 Workflow Recomendado

### Para Debugging:

1. **Reproduce el problema**
2. **Copia el Correlation ID** del header `X-Correlation-ID`
3. **Ve a Grafana** y pega el ID
4. **Analiza el flujo completo** en los logs filtrados
5. **Identifica dónde falló** (Gateway, Orders, Pricing, etc.)

### Para Performance Analysis:

1. **Haz un request**
2. **Copia el Correlation ID**
3. **En Grafana, filtra:** `correlationId:"ID" AND duration:>50ms`
4. **Identifica el cuello de botella**

### Para Auditoría:

1. **Cliente reporta problema**
2. **Obtén el timestamp del cliente**
3. **Busca en Grafana** en ese rango de tiempo
4. **Filtra por Correlation ID** del request problemático
5. **Genera reporte** con todos los logs

---

**Última actualización:** 26 de diciembre de 2025  
**Versión del dashboard:** 2.0 (con filtro de Correlation ID)
