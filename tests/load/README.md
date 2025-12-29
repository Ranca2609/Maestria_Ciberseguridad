# QuetzalShip Load Testing

Pruebas de carga automatizadas para la API de QuetzalShip usando Locust.

## 🚀 Quick Start

### Instalación

```bash
# Instalar dependencias
pip install -r requirements.txt
```

### Ejecución

```bash
# Con UI web
locust -f locustfile.py --host http://localhost:3000

# Headless (sin UI)
locust -f locustfile.py --host http://localhost:3000 --headless -u 100 -r 10 -t 60s
```

Luego abre tu navegador en: http://localhost:8089

## 📊 Escenarios de Prueba

### Prueba Rápida (1 minuto)

```bash
locust -f locustfile.py --host http://localhost:3000 --headless -u 50 -r 10 -t 1m
```

### Prueba de Carga Normal (10 minutos)

```bash
locust -f locustfile.py --host http://localhost:3000 --headless -u 100 -r 10 -t 10m --html report.html
```

### Prueba de Estrés (5 minutos)

```bash
locust -f locustfile.py --host http://localhost:3000 --headless -u 300 -r 30 -t 5m --html stress-report.html
```

## 📖 Documentación Completa

Para más detalles, consulta [LOCUST_LOAD_TESTING.md](../../docs/LOCUST_LOAD_TESTING.md)

## 🎯 Endpoints Probados

- `POST /api/v1/orders` - Crear orden (peso: 3)
- `GET /api/v1/orders` - Listar órdenes (peso: 5)
- `GET /api/v1/orders/:id` - Detalles de orden (peso: 2)
- `GET /api/v1/orders/:id/receipt` - Obtener recibo (peso: 1)
- `GET /health` - Health check (peso: 2)
- `GET /api/v1/fx/rates` - Tipos de cambio (peso: 1)

## 🔧 Configuración

El archivo `locustfile.py` está configurado para:

- **Wait time**: 1-3 segundos entre tareas
- **Correlation IDs**: Generados automáticamente
- **Idempotency Keys**: Para cada request POST
- **Paquetes aleatorios**: Datos realistas de envío
- **Gestión de órdenes**: Mantiene las últimas 100 órdenes creadas

## 📈 Criterios de Éxito

- ✅ Tasa de error < 1%
- ✅ Tiempo de respuesta promedio < 300ms
- ✅ P95 < 500ms
- ✅ Sistema estable durante la prueba

## 🐛 Troubleshooting

### Connection refused

Verifica que el gateway esté corriendo:

```bash
curl http://localhost:3000/health
```

### Muchos fallos

Reduce la carga:

```bash
locust -f locustfile.py --host http://localhost:3000 --headless -u 20 -r 2 -t 1m
```

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2025
