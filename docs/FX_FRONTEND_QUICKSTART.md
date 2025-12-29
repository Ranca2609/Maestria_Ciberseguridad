# 🚀 Inicio Rápido - Validación FX desde Frontend

## ⚡ 3 Pasos para Empezar

### 1️⃣ Levantar Servicios

```powershell
cd c:\Users\Kevin\Documents\2025\vacasDiciembre2025\Pure\Maestria_Ciberseguridad
docker-compose -f docker-compose.dev.yml up -d
```

**Esperar ~30 segundos** hasta que todos los servicios estén listos.

### 2️⃣ Verificar Estado

```powershell
docker-compose -f docker-compose.dev.yml ps
```

**Debe mostrar:**
```
NAME                      STATUS
quetzalship-frontend      Up 10 seconds (healthy)
quetzalship-gateway       Up 10 seconds (healthy)
quetzalship-fx            Up 10 seconds
quetzalship-redis         Up 10 seconds
```

### 3️⃣ Abrir en Navegador

```
http://localhost:4200/currency
```

O navega desde la página principal: **QuetzalShip** → **Conversión FX**

---

## 🧪 Primera Prueba (30 segundos)

### Validar Caché Redis

1. En la UI, selecciona:
   - **Desde:** GTQ
   - **Hacia:** USD
   - **Monto:** 100

2. Click **💱 Convertir**

3. Observa el resultado:
   ```
   ✅ Monto Convertido: ~12.82 USD
   ✅ Tasa: ~0.128205
   ✅ Proveedor: primary-api 🟢
   ✅ Origen: 🌐 API
   ```

4. **SIN CAMBIAR NADA**, click **💱 Convertir** nuevamente

5. Observa que ahora muestra:
   ```
   ✅ Origen: 💾 Caché  ← ¡CAMBIÓ!
   ```

**✅ ÉXITO:** El caché Redis está funcionando correctamente.

---

## 📊 Segunda Prueba (1 minuto)

### Validar Tasas Múltiples

1. Cambiar al tab **📈 Tasas Múltiples**

2. Seleccionar moneda base: **GTQ**

3. Click **📈 Obtener Todas las Tasas**

4. Ver tabla con 4 tasas:

| Moneda | Tasa | Equivalencia |
|--------|------|--------------|
| USD | 0.128205 | 1 GTQ = 0.13 USD |
| EUR | 0.117948 | 1 GTQ = 0.12 EUR |
| GBP | 0.101282 | 1 GTQ = 0.10 GBP |
| MXN | 2.205128 | 1 GTQ = 2.21 MXN |

5. Repetir inmediatamente → debe mostrar **💾 Caché**

**✅ ÉXITO:** Tasas múltiples funcionales con caché.

---

## 🔍 Tercera Prueba (2 minutos)

### Validar Circuit Breaker en Logs

1. Abrir terminal y ejecutar:
   ```powershell
   docker-compose -f docker-compose.dev.yml logs fx -f
   ```

2. En la UI, hacer **10 conversiones rápidas** (click 10 veces en "💱 Convertir")

3. En los logs, buscar:
   ```
   [FxService] Converting 100 GTQ to USD
   [FxService] Cache hit for GTQ -> USD
   [CircuitBreaker] Breaker for primary-api is closed
   ```

4. Si ves eventos del circuit breaker (`open`, `halfOpen`, `close`), significa que está funcionando.

**✅ ÉXITO:** Circuit breaker está monitoreando las APIs.

---

## 🐛 Si Algo Falla

### Frontend no carga

```powershell
# Rebuild frontend
docker-compose -f docker-compose.dev.yml up -d --build frontend

# Ver logs
docker-compose -f docker-compose.dev.yml logs frontend
```

### Error "Cannot connect to FX service"

```powershell
# Verificar que FX service está corriendo
docker-compose -f docker-compose.dev.yml ps fx

# Reiniciar FX service
docker-compose -f docker-compose.dev.yml restart fx
```

### Caché no funciona

```powershell
# Verificar Redis
docker exec -it quetzalship-redis redis-cli PING
# Debe responder: PONG

# Ver keys en Redis
docker exec -it quetzalship-redis redis-cli KEYS "*"
```

---

## 📖 Documentación Completa

- **Guía de Validación Completa:** [FX_FRONTEND_VALIDATION.md](FX_FRONTEND_VALIDATION.md)
- **Resumen de Implementación:** [FX_FRONTEND_IMPLEMENTATION_SUMMARY.md](FX_FRONTEND_IMPLEMENTATION_SUMMARY.md)
- **Validación Backend:** [FX_SERVICE_VALIDATION.md](FX_SERVICE_VALIDATION.md)

---

## ⏱️ Tiempo Total de Validación

| Prueba | Tiempo |
|--------|--------|
| Inicio de servicios | 30 seg |
| Prueba de caché | 30 seg |
| Prueba de tasas múltiples | 1 min |
| Prueba de circuit breaker | 2 min |
| **TOTAL** | **~4 minutos** |

---

**¡Listo! Comienza a validar el servicio FX desde la UI** 🎉
