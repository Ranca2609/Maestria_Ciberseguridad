# Guía de Pruebas de Carga con Locust - QuetzalShip

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Ejecución Local](#ejecución-local)
- [Ejecución en Kubernetes](#ejecución-en-kubernetes)
- [Configuración de Pruebas](#configuración-de-pruebas)
- [Interpretación de Resultados](#interpretación-de-resultados)
- [Escenarios de Prueba](#escenarios-de-prueba)
- [Solución de Problemas](#solución-de-problemas)

---

## 📝 Descripción General

Locust es una herramienta de pruebas de carga de código abierto que simula usuarios concurrentes para evaluar el rendimiento del sistema QuetzalShip. Este proyecto incluye:

- **Archivo de pruebas**: `tests/load/locustfile.py`
- **Despliegue K8s**: `k8s/testing/locust/deployment.yaml`
- **Arquitectura**: Master-Worker para escalabilidad

### Endpoints Probados

| Endpoint | Peso | Descripción |
|----------|------|-------------|
| `GET /api/v1/orders` | 5 | Listar órdenes (más frecuente) |
| `POST /api/v1/orders` | 3 | Crear orden |
| `GET /health` | 2 | Health check |
| `GET /api/v1/orders/:id` | 2 | Detalles de orden |
| `GET /api/v1/orders/:id/receipt` | 1 | Obtener recibo |
| `GET /api/v1/fx/rates` | 1 | Consultar tipo de cambio |

---

## 🔧 Prerrequisitos

### Opción 1: Ejecución Local

```bash
# Python 3.8 o superior
python --version

# pip actualizado
pip --version
```

### Opción 2: Ejecución en Kubernetes

```bash
# Cluster de Kubernetes activo
kubectl cluster-info

# Namespace quetzalship creado
kubectl get namespace quetzalship
```

---

## 📦 Instalación

### Instalación Local de Locust

```bash
# Crear entorno virtual (recomendado)
python -m venv venv

# Activar entorno virtual
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Instalar Locust
pip install locust

# Verificar instalación
locust --version
```

### Instalación de Dependencias Adicionales

```bash
# Si necesitas generar reportes
pip install locust-plugins
```

---

## 🚀 Ejecución Local

### 1. Navegación al Directorio

```bash
cd tests/load
```

### 2. Ejecución Básica con Interfaz Web

```bash
# Apuntar al gateway local
locust -f locustfile.py --host http://localhost:3000
```

Luego abre tu navegador en: **http://localhost:8089**

#### Configuración en la UI Web:

- **Number of users**: Usuarios concurrentes (ej: 100)
- **Spawn rate**: Usuarios por segundo (ej: 10)
- **Host**: Ya configurado en comando

### 3. Ejecución sin Interfaz (Headless)

```bash
# Prueba rápida: 50 usuarios, 10 spawn rate, 60 segundos
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 50 \
  --spawn-rate 10 \
  --run-time 60s

# Prueba de estrés: 200 usuarios, duración 5 minutos
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 200 \
  --spawn-rate 20 \
  --run-time 5m
```

### 4. Generar Reportes

```bash
# Con reporte HTML
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 100 \
  --spawn-rate 10 \
  --run-time 2m \
  --html report.html

# Con reporte CSV
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 100 \
  --spawn-rate 10 \
  --run-time 2m \
  --csv results
```

### 5. Ejecución contra Entornos Diferentes

```bash
# Desarrollo
locust -f locustfile.py --host http://localhost:3000

# Staging (Kubernetes local)
locust -f locustfile.py --host http://localhost

# Producción (con dominio)
locust -f locustfile.py --host https://quetzalship.example.com
```

---

## ☸️ Ejecución en Kubernetes

### 1. Desplegar Locust en Cluster

```bash
# Aplicar configuración
kubectl apply -f k8s/testing/locust/deployment.yaml

# Verificar despliegue
kubectl get pods -n quetzalship -l app=locust

# Verificar servicios
kubectl get svc -n quetzalship -l app=locust
```

### 2. Acceder a la Interfaz Web

#### Opción A: Port Forward

```bash
# Exponer UI de Locust localmente
kubectl port-forward -n quetzalship svc/locust-master 8089:8089

# Abrir navegador en: http://localhost:8089
```

#### Opción B: Ingress (si está configurado)

```bash
# Obtener host del ingress
kubectl get ingress -n quetzalship locust-ingress

# Agregar a /etc/hosts (Linux/Mac) o C:\Windows\System32\drivers\etc\hosts (Windows)
# <EXTERNAL-IP> locust.quetzalship.local

# Acceder en navegador: http://locust.quetzalship.local
```

### 3. Escalar Workers

```bash
# Escalar a 5 workers para más carga
kubectl scale deployment locust-worker -n quetzalship --replicas=5

# Verificar escalado
kubectl get pods -n quetzalship -l role=worker
```

### 4. Ver Logs

```bash
# Logs del master
kubectl logs -n quetzalship -l role=master -f

# Logs de workers
kubectl logs -n quetzalship -l role=worker -f

# Logs de un worker específico
kubectl logs -n quetzalship <worker-pod-name> -f
```

### 5. Limpiar Recursos

```bash
# Eliminar despliegue de Locust
kubectl delete -f k8s/testing/locust/deployment.yaml

# O eliminar recursos individuales
kubectl delete deployment locust-master locust-worker -n quetzalship
kubectl delete svc locust-master -n quetzalship
kubectl delete configmap locust-config -n quetzalship
```

---

## ⚙️ Configuración de Pruebas

### Modificar el Locustfile

El archivo `tests/load/locustfile.py` define el comportamiento de los usuarios simulados:

```python
# Ajustar tiempo de espera entre tareas
wait_time = between(1, 3)  # 1-3 segundos

# Modificar pesos de tareas
@task(5)  # Peso 5 - más frecuente
def list_orders(self):
    ...

@task(1)  # Peso 1 - menos frecuente
def get_fx_rate(self):
    ...
```

### Escenarios Personalizados

#### Prueba de Carga Sostenida

```bash
# 100 usuarios durante 30 minutos
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 100 \
  --spawn-rate 5 \
  --run-time 30m
```

#### Prueba de Pico (Spike Test)

```bash
# Incremento rápido: 500 usuarios en 10 segundos
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 500 \
  --spawn-rate 50 \
  --run-time 2m
```

#### Prueba de Estrés

```bash
# Incrementar gradualmente hasta fallo
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 1000 \
  --spawn-rate 10 \
  --run-time 10m
```

#### Prueba de Resistencia (Soak Test)

```bash
# Carga moderada durante tiempo prolongado
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 50 \
  --spawn-rate 5 \
  --run-time 2h
```

---

## 📊 Interpretación de Resultados

### Métricas Clave

La interfaz de Locust muestra:

| Métrica | Descripción | Valores Ideales |
|---------|-------------|-----------------|
| **RPS** | Requests per Second | > 100 RPS |
| **Response Time (avg)** | Tiempo promedio | < 200ms |
| **Response Time (95%)** | Percentil 95 | < 500ms |
| **Failure Rate** | Porcentaje de fallos | < 1% |
| **Current Users** | Usuarios activos | Según configuración |

### Análisis de Resultados

#### ✅ Resultados Buenos

```
Type        Name                    # reqs    # fails   Avg    Min    Max  Median  req/s
------------------------------------------------------------------------------------------
GET         /api/v1/orders           5000      0       120     50    450    100    167
POST        /api/v1/orders           3000      0       180     80    600    150    100
GET         /health                  2000      0        45     20    150     40     67

Total                               10000      0       125     20    600    100    334
```

- Tasa de fallo: 0%
- Tiempos de respuesta estables
- RPS alto y sostenido

#### ⚠️ Resultados con Problemas

```
Type        Name                    # reqs    # fails   Avg    Min    Max  Median  req/s
------------------------------------------------------------------------------------------
POST        /api/v1/orders           1500     450     2500    100   8000   2000     50
GET         /api/v1/orders           3000     100     1200     50   5000    900    100

Total                                4500     550     1650     50   8000   1200    150
```

- Alta tasa de fallo (12%)
- Tiempos de respuesta elevados
- Possible sobrecarga del sistema

### Exportar Estadísticas

```bash
# Durante ejecución headless, se generan archivos CSV
# results_stats.csv - Estadísticas generales
# results_stats_history.csv - Histórico
# results_failures.csv - Fallos registrados
```

---

## 🎯 Escenarios de Prueba

### Escenario 1: Validación Básica

**Objetivo**: Verificar que el sistema funciona correctamente bajo carga mínima.

```bash
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 10 \
  --spawn-rate 2 \
  --run-time 1m
```

**Criterios de Éxito**:
- 0% de fallos
- Tiempo de respuesta < 200ms

### Escenario 2: Carga Normal

**Objetivo**: Simular tráfico típico de producción.

```bash
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 100 \
  --spawn-rate 10 \
  --run-time 10m
```

**Criterios de Éxito**:
- < 1% fallos
- Avg response < 300ms
- P95 < 500ms

### Escenario 3: Carga Pico

**Objetivo**: Evaluar comportamiento durante picos de tráfico.

```bash
locust -f locustfile.py \
  --host http://localhost:3000 \
  --headless \
  --users 300 \
  --spawn-rate 30 \
  --run-time 5m
```

**Criterios de Éxito**:
- < 5% fallos
- Avg response < 500ms
- Sistema no colapsa

### Escenario 4: Prueba de Límites

**Objetivo**: Encontrar el punto de quiebre del sistema.

```bash
# Incrementar usuarios hasta que fallen las pruebas
for users in 100 200 500 1000 2000; do
  echo "Testing with $users users..."
  locust -f locustfile.py \
    --host http://localhost:3000 \
    --headless \
    --users $users \
    --spawn-rate 50 \
    --run-time 2m \
    --html report_${users}_users.html
  sleep 10
done
```

---

## 🔍 Monitoreo Durante Pruebas

### Monitoreo del Gateway (Kubernetes)

```bash
# CPU y Memoria del gateway
kubectl top pod -n quetzalship -l app=gateway

# Logs en tiempo real
kubectl logs -n quetzalship -l app=gateway -f --tail=100
```

### Monitoreo de Servicios

```bash
# Todos los pods
kubectl top pod -n quetzalship

# Servicios específicos
kubectl top pod -n quetzalship -l app=orders
kubectl top pod -n quetzalship -l app=pricing
```

### Grafana (si está desplegado)

```bash
# Port-forward a Grafana
kubectl port-forward -n quetzalship svc/grafana 3001:80

# Dashboard URL: http://localhost:3001
# Usuario: admin / admin
```

Métricas a observar:
- Request rate
- Response time percentiles
- Error rate
- CPU/Memory usage
- Database connections

---

## 🐛 Solución de Problemas

### Error: "Connection refused"

```bash
# Verificar que el servicio esté corriendo
curl http://localhost:3000/health

# Si está en K8s
kubectl get svc -n quetzalship gateway-service
```

### Error: "Too many open files"

```bash
# Aumentar límite de archivos (Linux/Mac)
ulimit -n 10000

# Verificar límite actual
ulimit -n
```

### Alto porcentaje de fallos

1. **Revisar logs del servidor**:
   ```bash
   kubectl logs -n quetzalship -l app=gateway --tail=100
   ```

2. **Reducir carga**:
   ```bash
   # Menos usuarios o spawn rate más lento
   --users 50 --spawn-rate 5
   ```

3. **Verificar recursos**:
   ```bash
   kubectl top pod -n quetzalship
   ```

### Workers no conectan al Master (K8s)

```bash
# Verificar servicio del master
kubectl get svc -n quetzalship locust-master

# Revisar logs de workers
kubectl logs -n quetzalship -l role=worker

# Verificar conectividad
kubectl exec -n quetzalship -it <worker-pod> -- ping locust-master
```

### Locust UI no carga

```bash
# Verificar port-forward
kubectl port-forward -n quetzalship svc/locust-master 8089:8089

# Verificar pod del master
kubectl get pod -n quetzalship -l role=master

# Ver logs
kubectl logs -n quetzalship -l role=master
```

---

## 📈 Mejores Prácticas

### 1. Configuración Gradual

- Empezar con pocos usuarios (10-20)
- Incrementar gradualmente
- Observar métricas en cada paso

### 2. Tiempos de Espera Realistas

```python
# Simular comportamiento humano
wait_time = between(1, 5)  # No usar 0
```

### 3. Distribución de Carga

```python
# Usar pesos apropiados según tráfico real
@task(10)  # Operación muy frecuente
@task(1)   # Operación rara
```

### 4. Cleanup de Datos

- Las pruebas crean órdenes en la BD
- Limpiar datos de prueba periódicamente
- Usar BD de prueba separada si es posible

### 5. Monitoreo Completo

- Observar métricas del servidor simultáneamente
- Usar Grafana/Kibana durante las pruebas
- Revisar logs para errores ocultos

---

## 🔗 Recursos Adicionales

- [Documentación Oficial de Locust](https://docs.locust.io/)
- [Locust on GitHub](https://github.com/locustio/locust)
- [Best Practices for Load Testing](https://docs.locust.io/en/stable/running-in-kubernetes.html)

---

## 📝 Checklist de Pruebas

Antes de considerar las pruebas completas:

- [ ] Validación básica (10 usuarios) - 0% fallos
- [ ] Carga normal (100 usuarios) - < 1% fallos
- [ ] Carga pico (300 usuarios) - < 5% fallos
- [ ] Prueba de resistencia (2 horas) - sistema estable
- [ ] Reportes generados y revisados
- [ ] Métricas de Grafana revisadas
- [ ] Logs sin errores críticos
- [ ] Documentación de resultados

---

## 📞 Contacto y Soporte

Para problemas o preguntas sobre las pruebas de carga:
- Revisar logs del sistema
- Consultar documentación en `docs/`
- Verificar configuración de Kubernetes

**Última actualización**: Diciembre 2025
