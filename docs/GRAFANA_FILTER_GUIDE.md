# 🎯 Guía Rápida: Filtrar Logs por Correlation ID en Grafana

## ¿Cómo usar el filtro?

### Paso 1: Obtener un Correlation ID

Ejecuta el script para hacer un request y obtener el ID:
```powershell
.\scripts\get-correlation-id.ps1
```

El script te dará un Correlation ID como: `31f9fbe5-27b8-4566-87f8-a7724a86664e`
**Y lo copiará automáticamente al portapapeles!** ✅

---

### Paso 2: Abrir Grafana

1. Abre: **http://localhost:3001**
2. Login: `admin` / `quetzalship`
3. Ve al dashboard: **"QuetzalShip - Logs Avanzados"**

---

### Paso 3: Usar el Filtro

En la parte superior del dashboard, verás un campo de texto que dice:

```
Correlation ID: [         ]
```

**Opción A - Pegar directamente:**
1. Haz clic en el campo de texto
2. Pega el Correlation ID (Ctrl+V)
3. Presiona Enter

**Opción B - Buscar con sintaxis Lucene:**
Pega el ID con el formato de query:
```
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e"
```

---

### Paso 4: Ver los Resultados

El panel **"Logs Recientes (Filtrados)"** mostrará:

✅ **Solo los logs de ese Correlation ID específico**

Verás algo como:
```
2025-12-26 12:34:56.789 | gateway | info  | Incoming request
2025-12-26 12:34:56.790 | gateway | info  | Request completed
2025-12-26 12:34:56.791 | orders  | info  | Order created
2025-12-26 12:34:56.792 | pricing | info  | Price calculated
```

Todos con el mismo `correlationId` = rastreo completo del request 🎉

---

## 🔄 Ejemplos de Uso

### Ver TODOS los logs (sin filtro)
Deja el campo **vacío** o pon solo `*`

### Filtrar por Correlation ID específico
```
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e"
```

### Ver solo errores de un Correlation ID
```
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e" AND logLevel:error
```

### Ver logs de un servicio específico con un Correlation ID
```
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e" AND serviceName:gateway
```

---

## 🎨 Visualización

El dashboard tiene estos paneles:

1. **Errores Totales** - Cuenta de errores (no se filtra por correlation ID)
2. **Logs por Nivel** - Distribución info/warn/error (no se filtra)
3. **Errores por Servicio** - Gráfico de barras (no se filtra)
4. **Distribución de Logs** - Timeline (no se filtra)
5. **Logs Recientes (Filtrados)** - ✅ **ESTE SÍ se filtra por Correlation ID**

---

## ⚡ Workflow Recomendado

### Para debugging:

1. **Reproduce el error**
   ```powershell
   .\scripts\get-correlation-id.ps1
   ```

2. **Copia el Correlation ID** (ya está en tu portapapeles)

3. **Ve a Grafana** (http://localhost:3001)

4. **Pega el ID** en el campo "Correlation ID"

5. **Analiza el flujo completo** en el panel de logs

6. **Identifica el problema** viendo todos los logs relacionados

---

## 🛠️ Troubleshooting

### El filtro no muestra nada

**Verifica que el Correlation ID existe:**
```powershell
curl "http://localhost:9200/quetzalship-logs-*/_search?pretty" -H "Content-Type: application/json" -d "{\"query\":{\"match\":{\"correlationId\":\"TU-ID-AQUI\"}},\"size\":1}"
```

### El campo de filtro no aparece

1. Espera 5-10 segundos después del reinicio de Grafana
2. Refresca la página (F5)
3. Verifica que estás en el dashboard correcto: "QuetzalShip - Logs Avanzados"

### Los logs siguen mostrando todo

- Verifica que pegaste el ID correctamente
- Asegúrate de presionar **Enter** después de pegar
- Si pegaste solo el UUID, intenta con: `correlationId:"tu-id"`

---

## 📋 Sintaxis de Queries Soportadas

Grafana con Elasticsearch soporta queries Lucene:

```
# Simple - Solo el UUID
31f9fbe5-27b8-4566-87f8-a7724a86664e

# Con campo específico (RECOMENDADO)
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e"

# Con múltiples condiciones
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e" AND serviceName:gateway

# Negación
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e" NOT logLevel:info

# Wildcard
correlationId:31f9fbe5*

# Rangos de tiempo (adicional al time picker de Grafana)
correlationId:"31f9fbe5-27b8-4566-87f8-a7724a86664e" AND @timestamp:[now-1h TO now]
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Cliente reporta error al crear orden

```powershell
# 1. Reproduce el error
.\scripts\get-correlation-id.ps1

# 2. Copia el Correlation ID del output
# 3. Pégalo en Grafana
# 4. Ve todos los logs de esa orden fallida
```

### Caso 2: Request lento (debugging de performance)

```
# En Grafana, filtra:
correlationId:"TU-ID" AND duration:>100ms
```

Verás qué servicio está tardando más de 100ms.

### Caso 3: Auditoría de una transacción

```
# En Grafana:
correlationId:"TU-ID"
```

Exporta los logs como JSON para tu reporte de auditoría.

---

**Última actualización:** 26 de diciembre de 2025

**Cambios en esta versión:**
- ✅ Agregado campo de texto "Correlation ID" en el dashboard
- ✅ Panel "Logs Recientes (Filtrados)" ahora usa la variable $correlationId
- ✅ Deja el campo vacío para ver todos los logs
- ✅ Pega un Correlation ID para ver solo ese request
