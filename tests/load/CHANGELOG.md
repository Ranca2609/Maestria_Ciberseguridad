# Changelog - Implementación de Locust

## [2025-12-26] - Implementación Completa de Pruebas de Carga con Locust

### ✨ Añadido

#### Archivos de Configuración
- `tests/load/requirements.txt` - Dependencias de Python para Locust
- `tests/load/.gitignore` - Ignorar reportes y archivos generados
- `tests/load/README.md` - Guía rápida de uso

#### Scripts de Ejecución
- `tests/load/run-locust.ps1` - Script PowerShell para Windows
- `tests/load/run-locust.sh` - Script Bash para Linux/Mac
- `tests/load/run-test-suite.ps1` - Suite completa de pruebas automatizadas

#### Documentación
- `docs/LOCUST_LOAD_TESTING.md` - Documentación completa y detallada
  - Guía de instalación
  - Instrucciones de ejecución local
  - Instrucciones de despliegue en Kubernetes
  - Escenarios de prueba predefinidos
  - Interpretación de resultados
  - Solución de problemas
  - Mejores prácticas

#### Archivos Existentes Actualizados
- `README.md` - Sección de pruebas de carga añadida

### 🎯 Características Implementadas

#### Tipos de Pruebas Disponibles
1. **Quick** - Validación rápida (50 usuarios, 1 min)
2. **Normal** - Carga normal (100 usuarios, 10 min)
3. **Stress** - Prueba de estrés (300 usuarios, 5 min)
4. **Spike** - Prueba de picos (500 usuarios, 2 min)
5. **Soak** - Resistencia (50 usuarios, 2 horas)
6. **Custom** - Configuración personalizada

#### Endpoints Probados
- `POST /api/v1/orders` - Crear orden (peso: 3)
- `GET /api/v1/orders` - Listar órdenes (peso: 5)
- `GET /api/v1/orders/:id` - Detalles de orden (peso: 2)
- `GET /api/v1/orders/:id/receipt` - Obtener recibo (peso: 1)
- `GET /health` - Health check (peso: 2)
- `GET /api/v1/fx/rates` - Tipos de cambio (peso: 1)

#### Funcionalidades del Locustfile
- ✅ Generación automática de Correlation IDs
- ✅ Idempotency Keys para requests POST
- ✅ Datos de prueba realistas y aleatorios
- ✅ Gestión inteligente de órdenes creadas
- ✅ Manejo de errores con catch_response
- ✅ Event handlers para reportes
- ✅ Simulación de comportamiento humano (wait_time)

#### Configuración de Kubernetes
- ✅ ConfigMap con locustfile
- ✅ Deployment Master (1 réplica)
- ✅ Deployment Worker (3 réplicas, escalable)
- ✅ Service para Master (ClusterIP)
- ✅ Ingress opcional para acceso web

### 📊 Scripts de Ejecución

#### Windows (PowerShell)
```powershell
# Prueba rápida
.\run-locust.ps1 -TestType quick -GenerateReport

# Suite completa
.\run-test-suite.ps1 -Host http://localhost:3000
```

#### Linux/Mac (Bash)
```bash
# Prueba rápida
./run-locust.sh -t quick -g

# Personalizada
./run-locust.sh -t custom -u 200 -r 20 -d 10m -g
```

### 📈 Reportes Generados

Los scripts pueden generar:
- **HTML Reports** - Visualización interactiva de resultados
- **CSV Files** - Datos para análisis
  - `*_stats.csv` - Estadísticas generales
  - `*_stats_history.csv` - Histórico temporal
  - `*_failures.csv` - Registro de fallos
- **Index HTML** - Índice de todos los reportes (suite)

### 🔧 Mejoras Técnicas

1. **Verificación de conectividad** antes de ejecutar pruebas
2. **Instalación automática** de Locust si no está presente
3. **Colores en output** para mejor legibilidad
4. **Timestamps** en nombres de reportes
5. **Parámetros configurables** vía línea de comandos
6. **Documentación exhaustiva** en español

### 📝 Archivos por Revisar

Si necesitas personalizar las pruebas:

1. **Configuración de pruebas**: `tests/load/locustfile.py`
2. **Parámetros de K8s**: `k8s/testing/locust/deployment.yaml`
3. **Scripts de ejecución**: `tests/load/run-locust.*`
4. **Documentación**: `docs/LOCUST_LOAD_TESTING.md`

### 🎓 Uso Recomendado

1. Comenzar con prueba `quick` para validación
2. Ejecutar `normal` para carga típica
3. Realizar `stress` para encontrar límites
4. Usar `soak` para pruebas de estabilidad a largo plazo
5. Monitorear Grafana/Kibana durante las pruebas

### ⚠️ Notas Importantes

- Las pruebas crean datos reales en la BD
- Limpiar datos de prueba periódicamente
- Usar entornos de prueba separados cuando sea posible
- Escalar workers en K8s para mayor carga

### 🔗 Referencias

- [Locust Documentation](https://docs.locust.io/)
- [Locust Best Practices](https://docs.locust.io/en/stable/running-in-kubernetes.html)
- Documentación del proyecto: `docs/LOCUST_LOAD_TESTING.md`

---

**Implementado por**: Sistema de Pruebas Automatizadas  
**Fecha**: 26 de diciembre de 2025  
**Versión Locust**: 2.20.0
