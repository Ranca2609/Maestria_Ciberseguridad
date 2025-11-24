# Preauditoría de Sistema de Gestión de Seguridad de la Información (SGSI)
## Industrias Vaine - Gotan City
### Basado en ISO/IEC 27001:2022

---

## 1. Introducción

El presente documento constituye el informe de preauditoría del Sistema de Gestión de Seguridad de la Información (SGSI) de Industrias Vaine, empresa multinacional de tecnología avanzada con sede en Gotan City. Esta preauditoría se ha realizado como parte del proceso de implementación y futura certificación bajo la norma ISO/IEC 27001:2022, con el objetivo de evaluar el nivel actual de cumplimiento de los controles de seguridad y establecer una hoja de ruta para alcanzar la certificación.

### 1.1 Alcance de la preauditoría

La preauditoría comprende la evaluación del estado actual de la seguridad de la información en Industrias Vaine, incluyendo:

- Identificación y valoración de activos de información críticos
- Análisis de la implementación actual de controles de seguridad según ISO 27001:2022
- Evaluación de brechas (gap analysis) respecto a los requisitos de la norma
- Elaboración del Statement of Applicability (SOA) preliminar

### 1.2 Metodología aplicada

La metodología empleada para esta preauditoría se estructura en las siguientes fases:

1. **Fase de planificación**: Definición del alcance y objetivos de la auditoría
2. **Fase de recopilación de información**: Entrevistas con personal clave, revisión documental y análisis de infraestructura
3. **Fase de evaluación**: Análisis de activos, controles existentes y nivel de madurez
4. **Fase de reporting**: Documentación de hallazgos y elaboración de recomendaciones

---

## 2. Descripción de la organización

### 2.1 Perfil corporativo

**Industrias Vaine** es una empresa multinacional de tecnología avanzada reconocida por sus desarrollos en tres áreas estratégicas:

- **Tecnología de defensa**: Sistemas de comunicación segura y equipamiento militar
- **Inteligencia**: Soluciones de análisis de datos y vigilancia tecnológica
- **Comunicación**: Infraestructuras de telecomunicaciones de alta seguridad

### 2.2 Contexto de seguridad

La organización opera en un entorno de alto riesgo caracterizado por:

- **Amenazas persistentes avanzadas (APT)**: Industrias Vaine es objetivo frecuente de organizaciones criminales y agentes hostiles estatales
- **Ataques dirigidos**: Intentos de intrusión por parte de hackers especializados en espionaje industrial
- **Alto valor de los activos**: Los secretos industriales y tecnológicos representan el core business de la compañía
- **Requisitos regulatorios estrictos**: Como proveedor del sector defensa, debe cumplir normativas específicas de seguridad nacional

### 2.3 Motivación para la certificación ISO 27001

Bruno Vaine, propietario de Industrias Vaine, ha identificado la necesidad estratégica de implementar y certificar un SGSI bajo ISO 27001:2022 por las siguientes razones:

1. Mantener la integridad operativa frente a amenazas crecientes
2. Proteger los secretos industriales y tecnológicos de la compañía
3. Cumplir con requisitos contractuales de clientes gubernamentales
4. Demostrar compromiso con la seguridad ante stakeholders
5. Establecer un marco estructurado de gestión de riesgos

---

## 3. Inventario y categorización de activos

La identificación y categorización de activos constituye el primer paso fundamental para establecer el alcance del SGSI. Se han identificado los siguientes activos críticos de Industrias Vaine:

### 3.1 Activos de información

| ID | Activo | Categoría | Confidencialidad | Integridad | Disponibilidad | Criticidad |
|----|--------|-----------|------------------|------------|----------------|------------|
| A01 | Planos de sistemas de defensa | Información | CRÍTICA | ALTA | MEDIA | CRÍTICA |
| A02 | Base de datos de clientes gubernamentales | Información | CRÍTICA | CRÍTICA | ALTA | CRÍTICA |
| A03 | Propiedad intelectual (patentes) | Información | CRÍTICA | CRÍTICA | MEDIA | CRÍTICA |
| A04 | Algoritmos de cifrado propietarios | Información | CRÍTICA | CRÍTICA | ALTA | CRÍTICA |
| A05 | Proyectos de I+D en curso | Información | CRÍTICA | ALTA | MEDIA | CRÍTICA |

### 3.2 Activos de software

| ID | Activo | Categoría | Confidencialidad | Integridad | Disponibilidad | Criticidad |
|----|--------|-----------|------------------|------------|----------------|------------|
| A06 | Sistema ERP corporativo | Software | MEDIA | CRÍTICA | CRÍTICA | ALTA |
| A07 | Plataforma de diseño CAD/CAM | Software | ALTA | CRÍTICA | ALTA | ALTA |
| A08 | Sistema de gestión documental | Software | ALTA | ALTA | ALTA | ALTA |
| A09 | Software de simulación militar | Software | CRÍTICA | CRÍTICA | MEDIA | CRÍTICA |

### 3.3 Activos de hardware

| ID | Activo | Categoría | Confidencialidad | Integridad | Disponibilidad | Criticidad |
|----|--------|-----------|------------------|------------|----------------|------------|
| A10 | Servidores del centro de datos principal | Hardware | MEDIA | ALTA | CRÍTICA | CRÍTICA |
| A11 | Estaciones de trabajo de I+D | Hardware | ALTA | ALTA | ALTA | ALTA |
| A12 | Dispositivos de almacenamiento cifrado | Hardware | CRÍTICA | ALTA | MEDIA | ALTA |

### 3.4 Activos de servicios

| ID | Activo | Categoría | Confidencialidad | Integridad | Disponibilidad | Criticidad |
|----|--------|-----------|------------------|------------|----------------|------------|
| A13 | Conexión de internet corporativa | Servicio | MEDIA | ALTA | CRÍTICA | ALTA |
| A14 | Red privada virtual (VPN) | Servicio | CRÍTICA | ALTA | ALTA | CRÍTICA |
| A15 | Servicio de backup y recuperación | Servicio | ALTA | CRÍTICA | CRÍTICA | CRÍTICA |

### 3.5 Activos humanos

| ID | Activo | Categoría | Criticidad |
|----|--------|-----------|------------|
| A16 | Equipo de I+D (15 ingenieros senior) | Personal | CRÍTICA |
| A17 | Administradores de sistemas | Personal | ALTA |
| A18 | Equipo de ciberseguridad | Personal | ALTA |

---

## 4. Análisis de controles ISO 27001:2022

La norma ISO/IEC 27001:2022 establece 93 controles distribuidos en cuatro grandes dominios. A continuación se presenta el análisis de cinco controles representativos de cada dominio:

### 4.1 Controles organizacionales (Organizational Controls)

#### Control 5.1: Políticas de seguridad de la información

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Industrias Vaine cuenta con una política de seguridad general aprobada por la dirección hace 3 años, pero carece de políticas específicas para áreas críticas.

**Hallazgos**:
- ✓ Existe política general de seguridad aprobada por dirección
- ✗ No hay políticas específicas por dominio (clasificación de información, uso aceptable, respuesta a incidentes)
- ✗ La política no ha sido revisada ni actualizada en los últimos 2 años
- ✗ No existe evidencia de comunicación formal a todos los empleados

**Recomendaciones**:
- Actualizar la política general de seguridad incorporando amenazas actuales
- Desarrollar políticas específicas para cada dominio crítico
- Establecer un proceso de revisión anual
- Implementar programa de comunicación y sensibilización

---

#### Control 5.7: Inteligencia de amenazas

**Estado actual**: NO IMPLEMENTADO

**Descripción**: No existe un proceso formal de recopilación y análisis de inteligencia de amenazas.

**Hallazgos**:
- ✗ No hay suscripción a feeds de inteligencia de amenazas
- ✗ No se realiza análisis proactivo de amenazas emergentes
- ✗ No existe correlación con el perfil de riesgo de la organización
- ✗ No hay mecanismo de difusión de alertas de seguridad

**Impacto**: Dado que Industrias Vaine es objetivo de APTs, la falta de inteligencia de amenazas representa una brecha crítica.

**Recomendaciones**:
- Suscribirse a servicios de threat intelligence especializados en el sector defensa
- Establecer un equipo de análisis de amenazas
- Implementar plataforma de Threat Intelligence Platform (TIP)
- Desarrollar procedimientos de respuesta ante alertas de amenazas

---

#### Control 5.10: Uso aceptable de la información y otros activos asociados

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Existen normas informales sobre el uso de activos, pero no están documentadas ni formalizadas.

**Hallazgos**:
- ✓ Los empleados son conscientes de restricciones básicas
- ✗ No existe documento formal de uso aceptable (AUP)
- ✗ No se firma acuerdo de uso aceptable al ingresar
- ✗ No hay consecuencias definidas por incumplimiento

**Recomendaciones**:
- Elaborar Política de Uso Aceptable (AUP) detallada
- Incluir cláusulas específicas en contratos laborales
- Implementar proceso de firma y acknowledgement
- Establecer procedimiento disciplinario por violaciones

---

#### Control 5.23: Seguridad de la información en el uso de servicios cloud

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Se utilizan servicios cloud para funciones no críticas, pero sin evaluación de seguridad formal.

**Hallazgos**:
- ✓ Se utilizan proveedores cloud reconocidos (AWS, Azure)
- ✗ No hay evaluación de riesgos previa a contratación
- ✗ No se han revisado acuerdos de nivel de servicio (SLA) desde perspectiva de seguridad
- ✗ No existe inventario completo de servicios cloud en uso

**Recomendaciones**:
- Realizar inventario exhaustivo de servicios cloud
- Implementar proceso de due diligence para proveedores cloud
- Revisar y negociar SLAs con cláusulas de seguridad
- Considerar cloud privado para datos clasificados

---

#### Control 5.30: Preparación de las TIC para la continuidad del negocio

**Estado actual**: IMPLEMENTADO BÁSICAMENTE

**Descripción**: Existen planes de continuidad básicos, pero no han sido probados recientemente.

**Hallazgos**:
- ✓ Existe plan de continuidad de negocio (BCP)
- ✓ Se realizan backups regulares
- ✗ No se han realizado simulacros en los últimos 12 meses
- ✗ Los tiempos de recuperación (RTO/RPO) no están formalmente definidos

**Recomendaciones**:
- Definir objetivos de recuperación (RTO/RPO) para cada sistema crítico
- Realizar pruebas de recuperación ante desastres semestralmente
- Documentar procedimientos de failover
- Establecer sitio de recuperación alternativo

---

### 4.2 Controles de personas (People Controls)

#### Control 6.1: Investigación de antecedentes

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Se realiza verificación básica de antecedentes, pero no es exhaustiva para posiciones críticas.

**Hallazgos**:
- ✓ Se verifica identidad y referencias laborales
- ✗ No se realiza verificación de antecedentes penales sistemáticamente
- ✗ No hay diferenciación según criticidad del puesto
- ✗ No se realizan re-verificaciones periódicas

**Impacto**: Dado el valor de los activos y el riesgo de espionaje industrial, esto representa una vulnerabilidad significativa.

**Recomendaciones**:
- Implementar proceso de screening diferenciado según nivel de acceso
- Realizar verificación exhaustiva (background check) para posiciones críticas
- Incluir verificación de antecedentes penales y crediticios
- Establecer re-verificaciones cada 3 años para personal con acceso a información clasificada

---

#### Control 6.2: Términos y condiciones de empleo

**Estado actual**: IMPLEMENTADO

**Descripción**: Los contratos laborales incluyen cláusulas de confidencialidad y responsabilidades de seguridad.

**Hallazgos**:
- ✓ Contratos incluyen cláusulas de confidencialidad
- ✓ Se especifican responsabilidades de seguridad
- ✓ Existen acuerdos de no divulgación (NDA)
- ⚠ Las cláusulas no están alineadas con ISO 27001:2022

**Recomendaciones**:
- Revisar plantillas de contratos para alinearlas con ISO 27001:2022
- Incluir cláusulas específicas sobre protección de datos
- Establecer obligaciones post-empleo (cláusulas de no competencia)

---

#### Control 6.3: Concienciación, educación y capacitación en seguridad de la información

**Estado actual**: NO IMPLEMENTADO

**Descripción**: No existe programa formal de concienciación en seguridad.

**Hallazgos**:
- ✗ No hay programa de formación en seguridad al ingresar
- ✗ No se realizan campañas de concienciación periódicas
- ✗ No hay métricas de efectividad de la formación
- ✗ No se realizan simulacros de phishing

**Impacto**: El factor humano es el eslabón más débil. La falta de formación aumenta significativamente el riesgo de incidentes.

**Recomendaciones**:
- Desarrollar programa de awareness integral (presencial y e-learning)
- Implementar formación obligatoria al ingreso y anualmente
- Realizar campañas temáticas (phishing, ingeniería social, clasificación)
- Ejecutar simulacros de phishing trimestrales
- Establecer KPIs de awareness (tasa de clics en simulacros, reportes de incidentes)

---

#### Control 6.4: Proceso disciplinario

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Existe proceso disciplinario general, pero no específico para violaciones de seguridad.

**Hallazgos**:
- ✓ Existe proceso disciplinario laboral general
- ✗ No hay procedimiento específico para incidentes de seguridad
- ✗ No están definidas sanciones según gravedad de la violación
- ✗ No hay evidencia de aplicación de medidas disciplinarias por temas de seguridad

**Recomendaciones**:
- Desarrollar procedimiento disciplinario específico para seguridad de la información
- Establecer escalas de sanciones según severidad
- Documentar casos y crear precedentes
- Comunicar consecuencias en programa de awareness

---

#### Control 6.5: Responsabilidades después de la terminación o cambio de empleo

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Existe proceso de offboarding, pero no cubre todos los aspectos de seguridad.

**Hallazgos**:
- ✓ Se recuperan activos físicos (laptops, tarjetas de acceso)
- ✓ Se desactivan cuentas de usuario
- ✗ No hay checklist formal de offboarding de seguridad
- ✗ No se realizan entrevistas de salida sobre seguridad
- ✗ No hay seguimiento de obligaciones post-empleo

**Recomendaciones**:
- Desarrollar checklist de offboarding de seguridad
- Implementar entrevistas de salida con recordatorio de obligaciones
- Establecer mecanismo de seguimiento de NDAs post-empleo
- Revisar accesos de forma forense tras salidas de personal crítico

---

### 4.3 Controles físicos (Physical Controls)

#### Control 7.1: Perímetros de seguridad física

**Estado actual**: IMPLEMENTADO

**Descripción**: Las instalaciones cuentan con perímetros de seguridad física bien definidos.

**Hallazgos**:
- ✓ Cerco perimetral con control de acceso
- ✓ Recepción con personal de seguridad 24/7
- ✓ Áreas restringidas claramente señalizadas
- ⚠ No hay separación física de zonas según clasificación de información

**Recomendaciones**:
- Implementar zonificación de seguridad (pública, restringida, crítica)
- Establecer requerimientos de escolta para visitantes en áreas restringidas
- Reforzar perímetro de laboratorio de I+D

---

#### Control 7.2: Controles de acceso físico

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Existe sistema de control de acceso, pero no es robusto para todas las áreas.

**Hallazgos**:
- ✓ Sistema de tarjetas de acceso en entrada principal
- ✓ Registro de visitantes
- ✗ Áreas críticas (I+D, sala de servidores) no tienen control biométrico
- ✗ No hay mantraps o turniquetes anti-tailgating
- ✗ Puertas de emergencia no tienen alarmas

**Impacto**: Existe riesgo de acceso no autorizado a áreas críticas mediante tailgating o suplantación.

**Recomendaciones**:
- Implementar control biométrico en áreas críticas (huella/iris/facial)
- Instalar mantraps en acceso a sala de servidores y laboratorio de I+D
- Añadir sensores de apertura no autorizada en puertas de emergencia
- Implementar sistema de videovigilancia con detección de tailgating

---

#### Control 7.3: Seguridad de oficinas, despachos e instalaciones

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Las oficinas cuentan con medidas básicas de seguridad física.

**Hallazgos**:
- ✓ Política de escritorio limpio (no formalizada)
- ✗ No hay política de pantalla limpia (bloqueo automático)
- ✗ Impresoras multifunción en áreas abiertas sin control
- ✗ No hay destructoras de documentos certificadas en todas las áreas

**Recomendaciones**:
- Formalizar política de escritorio y pantalla limpia (clear desk/clear screen)
- Configurar bloqueo automático de estaciones de trabajo (5 minutos)
- Reubicar impresoras a áreas controladas o implementar autenticación
- Proveer destructoras de corte cruzado (DIN P-4) en todas las oficinas

---

#### Control 7.4: Monitoreo de seguridad física

**Estado actual**: IMPLEMENTADO BÁSICAMENTE

**Descripción**: Existe sistema de CCTV, pero con limitaciones.

**Hallazgos**:
- ✓ Sistema de CCTV con 35 cámaras
- ✓ Grabación continua con retención de 30 días
- ✗ No hay monitoreo en vivo 24/7
- ✗ Zonas ciegas en estacionamiento y perímetro trasero
- ✗ No hay integración con sistema de control de acceso

**Recomendaciones**:
- Implementar centro de control de seguridad (SOC físico) con monitoreo 24/7
- Ampliar cobertura de cámaras para eliminar zonas ciegas
- Integrar CCTV con sistema de control de acceso (correlación de eventos)
- Implementar analítica de video (detección de intrusión, reconocimiento facial)

---

#### Control 7.7: Escritorio limpio y pantalla limpia

**Estado actual**: NO IMPLEMENTADO

**Descripción**: No existe política formal ni se observa cumplimiento generalizado.

**Hallazgos**:
- ✗ No hay política documentada de clear desk/clear screen
- ✗ Se observan documentos confidenciales en escritorios fuera de horario laboral
- ✗ Estaciones de trabajo permanecen desbloqueadas
- ✗ No hay auditorías físicas de cumplimiento

**Impacto**: Alto riesgo de exposición de información confidencial ante visitantes, personal de limpieza o intrusos.

**Recomendaciones**:
- Emitir y comunicar política de escritorio y pantalla limpia
- Configurar bloqueo automático tras 5 minutos de inactividad
- Proveer cajoneras con cerradura para almacenamiento seguro
- Realizar auditorías físicas aleatorias fuera de horario
- Incluir cumplimiento en evaluaciones de desempeño

---

### 4.4 Controles tecnológicos (Technological Controls)

#### Control 8.1: Dispositivos de punto final de usuario

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Los dispositivos endpoint cuentan con protección básica, pero no gestionada centralmente.

**Hallazgos**:
- ✓ Antivirus instalado en todas las estaciones
- ✓ Firewall local activado
- ✗ No hay solución EDR (Endpoint Detection and Response)
- ✗ No hay gestión centralizada de configuraciones
- ✗ Dispositivos BYOD (Bring Your Own Device) sin control

**Impacto**: Exposición ante malware avanzado, APTs y amenazas de día cero.

**Recomendaciones**:
- Implementar solución EDR empresarial (CrowdStrike, SentinelOne, MS Defender ATP)
- Desplegar gestión de configuración centralizada (GPO/MDM)
- Prohibir BYOD o implementar solución de containerización (MDM)
- Aplicar cifrado de disco completo (BitLocker/FileVault)
- Implementar whitelisting de aplicaciones en estaciones críticas

---

#### Control 8.5: Autenticación segura

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Se utiliza autenticación basada en contraseñas con requisitos básicos.

**Hallazgos**:
- ✓ Política de contraseñas (8 caracteres, complejidad)
- ✓ Cambio obligatorio cada 90 días
- ✗ No hay autenticación multifactor (MFA) implementada
- ✗ No hay autenticación adaptativa según riesgo
- ✗ Contraseñas almacenadas con algoritmos débiles en aplicaciones legacy

**Impacto**: Crítico. La falta de MFA es una de las vulnerabilidades más explotadas en ataques dirigidos.

**Recomendaciones**:
- **PRIORIDAD CRÍTICA**: Implementar MFA para todos los accesos (TOTP, FIDO2, biometría)
- Exigir MFA obligatorio para accesos remotos (VPN) y sistemas críticos
- Implementar autenticación adaptativa (risk-based authentication)
- Considerar passwordless authentication para el futuro
- Migrar aplicaciones legacy a hash seguros (bcrypt, Argon2)

---

#### Control 8.7: Protección contra malware

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Existe protección antivirus básica, pero no estrategia integral anti-malware.

**Hallazgos**:
- ✓ Antivirus con actualización automática de firmas
- ✓ Escaneo programado semanal
- ✗ No hay protección contra ransomware específica
- ✗ No se analizan archivos en sandboxing
- ✗ No hay filtrado de URLs maliciosas en navegación
- ✗ Correo electrónico no pasa por sandbox

**Recomendaciones**:
- Implementar solución anti-ransomware con protección de carpetas
- Desplegar sandbox de análisis de archivos (Cuckoo, FireEye, Palo Alto WildFire)
- Implementar filtrado DNS contra dominios maliciosos (DNS-layer security)
- Configurar sandbox de email para analizar adjuntos antes de entrega
- Establecer procedimiento de análisis forense de malware

---

#### Control 8.8: Gestión de vulnerabilidades técnicas

**Estado actual**: NO IMPLEMENTADO

**Descripción**: No existe programa formal de gestión de vulnerabilidades.

**Hallazgos**:
- ✗ No se realizan escaneos de vulnerabilidades periódicos
- ✗ No hay inventario de software instalado
- ✗ No existe proceso de patch management
- ✗ Sistemas críticos con parches de seguridad pendientes (> 6 meses)
- ✗ No hay criterios de priorización de remediación

**Impacto**: **CRÍTICO**. Exposición directa a exploits conocidos. Esta es probablemente la brecha más grave identificada.

**Recomendaciones**:
- **ACCIÓN INMEDIATA**: Realizar assessment completo de vulnerabilidades (Nessus, Qualys, Rapid7)
- Implementar programa de Vulnerability Management estructurado
- Establecer SLAs de remediación según severidad (Crítico: 48h, Alto: 7 días, Medio: 30 días)
- Desplegar solución de patch management automatizado (WSUS, SCCM, ManageEngine)
- Crear comité de gestión de vulnerabilidades con participación IT y negocio
- Implementar escaneado continuo y monitoreo de CVEs

---

#### Control 8.9: Gestión de configuración

**Estado actual**: PARCIALMENTE IMPLEMENTADO

**Descripción**: Existe documentación básica de configuraciones, pero sin gestión formal.

**Hallazgos**:
- ✓ Diagramas de red desactualizados
- ✗ No hay baselines de configuración segura (hardening)
- ✗ Configuraciones no gestionadas mediante IaC (Infrastructure as Code)
- ✗ No hay control de cambios de configuración
- ✗ Configuraciones por defecto en dispositivos de red

**Recomendaciones**:
- Desarrollar baselines de hardening (CIS Benchmarks)
- Implementar gestión de configuración automatizada (Ansible, Puppet, Chef)
- Establecer proceso de Configuration Management Database (CMDB)
- Implementar monitoreo de drift de configuraciones
- Aplicar configuraciones seguras en dispositivos de red (deshabilitar protocolos inseguros)

---

## 5. Statement of Applicability (SOA)

El Statement of Applicability (Declaración de Aplicabilidad) es un documento fundamental del SGSI que identifica qué controles de ISO 27001:2022 son aplicables a Industrias Vaine y cuáles son excluidos, junto con las justificaciones correspondientes.

### 5.1 Resumen ejecutivo del SOA

De los 93 controles establecidos en ISO 27001:2022 Anexo A:

- **Controles aplicables**: 89 (95.7%)
- **Controles no aplicables**: 4 (4.3%)
- **Controles implementados completamente**: 8 (9.0%)
- **Controles implementados parcialmente**: 37 (41.6%)
- **Controles no implementados**: 44 (49.4%)

### 5.2 Controles no aplicables y justificación

| Control | Denominación | Justificación de exclusión |
|---------|--------------|----------------------------|
| 7.9 | Seguridad de los activos fuera de las instalaciones | Industrias Vaine no permite que activos críticos salgan de las instalaciones. Todo el trabajo con información clasificada debe realizarse en las oficinas. |
| 8.6 | Gestión de la capacidad | Los sistemas de Industrias Vaine operan con holgura significativa (<40% utilización). No hay aplicaciones con requisitos de capacidad críticos. Se monitoreará cuando sea necesario. |
| 8.28 | Codificación segura | Industrias Vaine no desarrolla software para comercialización. El desarrollo interno es mínimo y se realiza por proveedores bajo contrato que asumen esta responsabilidad. |
| 8.34 | Pruebas de seguridad en desarrollo y aceptación | Por la misma razón que 8.28, las pruebas de seguridad son responsabilidad de los proveedores de desarrollo externos. |

### 5.3 Matriz de implementación por dominios

| Dominio | Total controles | Implementados | Parciales | No implementados | No aplicables |
|---------|----------------|---------------|-----------|------------------|---------------|
| Organizacionales | 37 | 3 | 18 | 14 | 2 |
| Personas | 8 | 2 | 4 | 2 | 0 |
| Físicos | 14 | 2 | 7 | 5 | 1 |
| Tecnológicos | 34 | 1 | 8 | 23 | 1 |
| **TOTAL** | **93** | **8** | **37** | **44** | **4** |

### 5.4 Priorización de controles no implementados

Basándose en el análisis de riesgos y el contexto específico de Industrias Vaine, se establece la siguiente priorización:

#### Prioridad CRÍTICA (implementación inmediata - 0-3 meses)

1. **Control 8.8** - Gestión de vulnerabilidades técnicas
2. **Control 8.5** - Autenticación segura (MFA)
3. **Control 5.7** - Inteligencia de amenazas
4. **Control 8.16** - Monitorización de actividades
5. **Control 5.24** - Planificación y preparación de la gestión de incidentes de seguridad de la información

#### Prioridad ALTA (implementación 3-6 meses)

6. **Control 8.1** - Dispositivos de punto final de usuario (EDR)
7. **Control 6.3** - Concienciación, educación y capacitación
8. **Control 8.7** - Protección contra malware (estrategia integral)
9. **Control 7.2** - Controles de acceso físico (biometría)
10. **Control 8.25** - Ciclo de vida de desarrollo seguro

#### Prioridad MEDIA (implementación 6-12 meses)

11-30. Restantes controles no implementados según análisis de riesgos detallado

---

## 6. Análisis de brechas (Gap Analysis)

### 6.1 Brechas críticas identificadas

#### Brecha 1: Ausencia de programa de gestión de vulnerabilidades

**Impacto**: CRÍTICO

**Descripción**: No existe un proceso sistemático de identificación, evaluación y remediación de vulnerabilidades técnicas. Durante la preauditoría se identificaron:
- Sistemas con vulnerabilidades críticas conocidas (CVE con CVSS > 9.0)
- Servidores Windows sin parches de seguridad desde hace 8 meses
- Aplicaciones web con vulnerabilidades OWASP Top 10
- Dispositivos de red con firmware desactualizado

**Riesgo**: Exposición directa a explotación por parte de atacantes. Dado que Industrias Vaine es objetivo de APTs, esta brecha puede comprometer toda la organización.

**Remediación**:
1. Assessment inicial de vulnerabilidades (semana 1-2)
2. Remediación de emergencia de vulnerabilidades críticas (semana 3-4)
3. Implementación de plataforma de vulnerability management (mes 2)
4. Establecimiento de proceso continuo (mes 3)

**Inversión estimada**: 50,000 - 80,000 EUR (herramientas + recursos)

---

#### Brecha 2: Falta de autenticación multifactor (MFA)

**Impacto**: CRÍTICO

**Descripción**: Todos los sistemas se basan únicamente en contraseñas. No hay MFA implementado en ningún sistema, incluidos:
- Acceso VPN
- Sistemas administrativos
- Email corporativo
- Aplicaciones críticas

**Riesgo**: Las credenciales comprometidas (phishing, keyloggers, credential stuffing) permiten acceso directo sin capas adicionales de seguridad.

**Remediación**:
1. Implementación de MFA en VPN (semana 1-2)
2. Despliegue de MFA en Microsoft 365/Google Workspace (semana 3-4)
3. Integración de MFA en aplicaciones críticas (mes 2-3)
4. MFA obligatorio para todos los usuarios (mes 3)

**Inversión estimada**: 15,000 - 25,000 EUR (licencias + integración)

---

#### Brecha 3: Ausencia de detección y respuesta ante incidentes

**Impacto**: ALTO

**Descripción**: No existe capacidad de detección de incidentes de seguridad ni procedimientos de respuesta. No hay:
- SIEM (Security Information and Event Management)
- SOC (Security Operations Center)
- Procedimientos de respuesta a incidentes
- Equipo de respuesta a incidentes (CSIRT)

**Riesgo**: Los incidentes de seguridad pasan desapercibidos o se detectan tardíamente cuando el daño ya es significativo. El tiempo medio de detección de brechas en la industria es de 207 días (IBM Security).

**Remediación**:
1. Implementación de SIEM (Splunk, QRadar, Elastic Security) - mes 1-2
2. Creación de CSIRT interno - mes 2
3. Desarrollo de playbooks de respuesta - mes 3
4. Simulacros de respuesta a incidentes - mes 4

**Inversión estimada**: 80,000 - 150,000 EUR (herramientas + formación + recursos)

---

#### Brecha 4: Falta de programa de concienciación en seguridad

**Impacto**: ALTO

**Descripción**: El personal no recibe formación en seguridad de la información. No hay conciencia sobre:
- Ingeniería social y phishing
- Clasificación y manejo de información
- Procedimientos de seguridad
- Reporte de incidentes

**Riesgo**: El 82% de las brechas involucran el factor humano (Verizon DBIR 2024). Empleados no capacitados son el vector de entrada más común.

**Remediación**:
1. Desarrollo de programa de awareness - mes 1
2. Formación inicial obligatoria para todo el personal - mes 2
3. Campañas de phishing simulado - mes 3 (ongoing)
4. Formación especializada para roles críticos - mes 4

**Inversión estimada**: 20,000 - 35,000 EUR (plataforma + contenidos + gestión)

---

### 6.2 Nivel de madurez del SGSI

Aplicando el modelo de madurez CMMI adaptado a ISO 27001:

| Nivel | Descripción | Estado Industrias Vaine |
|-------|-------------|-------------------------|
| 0 - Inexistente | No hay procesos implementados | Algunos controles |
| 1 - Inicial | Procesos ad-hoc, reactivos | **← NIVEL ACTUAL** |
| 2 - Repetible | Procesos básicos, no documentados | Objetivo 6 meses |
| 3 - Definido | Procesos documentados y estandarizados | Objetivo 12 meses |
| 4 - Gestionado | Procesos medidos y controlados | Objetivo 18 meses |
| 5 - Optimizado | Mejora continua | Objetivo 24 meses |

**Nivel actual**: 1 - Inicial

**Nivel objetivo para certificación**: 3 - Definido (mínimo requerido)

---

### 6.3 Roadmap de implementación

La implementación del SGSI se estructura en cuatro fases:

#### Fase 1: Fundamentos críticos (Meses 1-3)

**Objetivo**: Eliminar riesgos críticos inmediatos

- Implementación de MFA
- Programa de gestión de vulnerabilidades
- Remediación de vulnerabilidades críticas
- Actualización de política de seguridad
- Formación inicial del personal

**Inversión**: 100,000 EUR
**Recursos**: Equipo interno + 1 consultor externo

---

#### Fase 2: Controles técnicos (Meses 4-6)

**Objetivo**: Desplegar controles de detección y protección

- Implementación de SIEM y SOC básico
- Despliegue de EDR
- Hardening de sistemas
- Implementación de controles biométricos
- Desarrollo de procedimientos de respuesta a incidentes

**Inversión**: 150,000 EUR
**Recursos**: Equipo interno + firma de consultoría

---

#### Fase 3: Controles organizacionales (Meses 7-9)

**Objetivo**: Formalizar procesos y gobernanza

- Desarrollo de políticas específicas
- Implementación de gestión de riesgos formal
- Auditorías internas
- Revisiones de seguridad de proveedores
- Ejercicios de respuesta a incidentes

**Inversión**: 80,000 EUR
**Recursos**: Equipo interno + auditor líder certificado

---

#### Fase 4: Preparación para certificación (Meses 10-12)

**Objetivo**: Alcanzar compliance completo con ISO 27001:2022

- Gap closure de controles pendientes
- Auditoría interna completa
- Auditoría de certificación etapa 1 (revisión documental)
- Remediación de hallazgos
- Auditoría de certificación etapa 2

**Inversión**: 60,000 EUR
**Recursos**: Equipo interno + entidad certificadora

---

**Inversión total estimada**: 390,000 EUR
**Duración**: 12 meses hasta auditoría de certificación

---

## 7. Análisis de riesgos preliminar

### 7.1 Principales amenazas identificadas

| ID | Amenaza | Probabilidad | Impacto | Riesgo | Activos afectados |
|----|---------|--------------|---------|--------|-------------------|
| T01 | APT dirigida por estado-nación | ALTA | CRÍTICO | CRÍTICO | A01, A03, A04, A05 |
| T02 | Ransomware | ALTA | ALTO | CRÍTICO | A06, A10, A15 |
| T03 | Robo de propiedad intelectual | ALTA | CRÍTICO | CRÍTICO | A03, A04, A05 |
| T04 | Espionaje industrial | MEDIA | CRÍTICO | ALTO | A01, A03, A04, A05 |
| T05 | Ingeniería social / Phishing | ALTA | ALTO | ALTO | Todos |
| T06 | Insider threat (amenaza interna) | MEDIA | CRÍTICO | ALTO | Todos |
| T07 | Exfiltración de datos | ALTA | CRÍTICO | CRÍTICO | A02, A03, A04, A05 |
| T08 | Sabotaje de sistemas críticos | BAJA | CRÍTICO | MEDIO | A06, A10 |
| T09 | Acceso físico no autorizado | MEDIA | ALTO | MEDIO | A10, A11, A12 |
| T10 | Fallo de proveedores críticos | MEDIA | ALTO | MEDIO | A13, A14, A15 |

### 7.2 Vulnerabilidades críticas explotables

1. **Ausencia de MFA**: Permite credential stuffing y phishing exitoso
2. **Vulnerabilidades técnicas sin parchear**: Exposición a exploits conocidos
3. **Falta de segmentación de red**: Movimiento lateral ilimitado tras compromiso inicial
4. **Ausencia de detección de amenazas**: Ataques persistentes sin detección
5. **Personal sin formación**: Vector de entrada mediante ingeniería social
6. **Controles físicos débiles**: Acceso no autorizado a áreas críticas
7. **Falta de cifrado end-to-end**: Interceptación de comunicaciones internas
8. **Ausencia de DLP**: Exfiltración de datos sin restricciones

---

## 8. Hallazgos destacados de la preauditoría

### 8.1 Fortalezas identificadas

1. **Compromiso de la dirección**: Bruno Vaine apoya firmemente la iniciativa de certificación
2. **Infraestructura básica**: Existe infraestructura IT sólida sobre la cual construir
3. **Personal técnico competente**: El equipo de IT tiene experiencia y capacidad de aprendizaje
4. **Conciencia del riesgo**: La organización comprende las amenazas que enfrenta
5. **Recursos disponibles**: Se cuenta con presupuesto para inversiones en seguridad

### 8.2 Debilidades críticas

1. **Gap significativo en controles técnicos**: 49.4% de controles no implementados
2. **Ausencia de cultura de seguridad**: Seguridad vista como responsabilidad de IT solamente
3. **Falta de procesos formales**: Muchas prácticas son ad-hoc y no documentadas
4. **Dependencia de pocos recursos clave**: No hay redundancia en conocimiento crítico
5. **Deuda técnica**: Sistemas legacy dificultan implementación de controles modernos

### 8.3 Observaciones adicionales

Durante la preauditoría se identificaron las siguientes observaciones que requieren atención:

1. **Gestión de identidades**: Los procesos de alta/baja/modificación de usuarios son manuales y lentos
2. **Gestión de proveedores**: No hay evaluaciones de seguridad de terceros que acceden a sistemas
3. **Backup y recuperación**: Aunque se realizan backups, no se han probado restauraciones completas
4. **Cifrado**: No hay cifrado sistemático de información sensible en reposo ni en tránsito
5. **Logs y trazabilidad**: Los logs no se centralizan ni retienen adecuadamente
6. **Segregación de funciones**: Administradores tienen privilegios excesivos sin segregación

---

## 9. Recomendaciones estratégicas

### 9.1 Recomendaciones de alta prioridad

#### 1. Creación del Comité de Seguridad de la Información

**Justificación**: La seguridad debe ser responsabilidad compartida a nivel ejecutivo, no solo de IT.

**Acción**:
- Formar comité con representación de dirección, IT, legal, RRHH y operaciones
- Reuniones mensuales para revisión de riesgos y decisiones estratégicas
- Reportar directamente a Bruno Vaine

---

#### 2. Contratación de CISO (Chief Information Security Officer)

**Justificación**: Se requiere liderazgo dedicado para orquestar la implementación del SGSI.

**Acción**:
- Contratar profesional certificado (CISSP, CISM o similar)
- Dependencia directa de dirección general
- Presupuesto y autoridad para implementar el programa

---

#### 3. Implementación de arquitectura Zero Trust

**Justificación**: El modelo de seguridad perimetral es insuficiente ante APTs. Se requiere verificación continua.

**Acción**:
- Adoptar principios de Zero Trust (nunca confiar, siempre verificar)
- Implementar microsegmentación de red
- Autenticación y autorización continuas
- Principio de mínimo privilegio en todos los accesos

---

#### 4. Programa de Threat Hunting proactivo

**Justificación**: Dado que Industrias Vaine es objetivo de APTs, la detección reactiva es insuficiente.

**Acción**:
- Formar equipo de threat hunting
- Utilizar threat intelligence específica del sector
- Realizar ejercicios de red teaming periódicos
- Participar en comunidades de threat intelligence

---

### 9.2 Consideraciones para el largo plazo

1. **Certificaciones adicionales**: Considerar ISO 27017 (cloud), 27018 (privacidad cloud), 27701 (privacidad)
2. **Cumplimiento sectorial**: Evaluar requisitos específicos del sector defensa (p.ej., NIST SP 800-171)
3. **Resiliencia**: Invertir en capacidades de recuperación ante desastres avanzadas
4. **Innovación segura**: Establecer laboratorio de seguridad para evaluación de nuevas tecnologías
5. **Ecosistema de proveedores**: Extender requisitos de seguridad a toda la cadena de suministro

---

## 10. Conclusiones

### 10.1 Evaluación del estado actual

Industrias Vaine se encuentra en una fase **inicial de madurez de seguridad de la información** (Nivel 1 - Inicial según CMMI). Aunque cuenta con algunos controles básicos implementados, presenta **brechas críticas** que exponen a la organización a riesgos significativos, especialmente considerando:

1. El alto valor de sus activos de información (propiedad intelectual, secretos industriales)
2. Su perfil como objetivo de amenazas persistentes avanzadas (APTs)
3. Su rol en el sector de defensa e inteligencia

De los 93 controles de ISO 27001:2022, solo **8 están completamente implementados** (9.0%), **37 están parcialmente implementados** (41.6%), y **44 no están implementados** (49.4%). Este gap del 49.4% representa un esfuerzo considerable para alcanzar la certificación.

### 10.2 Viabilidad de la certificación

**La certificación ISO 27001:2022 es viable y alcanzable en un plazo de 12 meses**, siempre que se cumplan las siguientes condiciones:

✓ **Compromiso de la dirección**: Mantenimiento del apoyo de Bruno Vaine y asignación de recursos
✓ **Inversión económica**: Presupuesto de aproximadamente 390,000 EUR
✓ **Recursos humanos**: Contratación de CISO y refuerzo del equipo de seguridad
✓ **Cambio cultural**: Transición de seguridad como función de IT a responsabilidad organizacional
✓ **Ejecución disciplinada**: Seguimiento riguroso del roadmap de implementación

### 10.3 Riesgos de no certificar

La no implementación de un SGSI basado en ISO 27001 expone a Industrias Vaine a:

1. **Riesgo operacional**: Interrupción del negocio por incidentes de seguridad
2. **Riesgo reputacional**: Pérdida de confianza de clientes gubernamentales tras una brecha
3. **Riesgo legal**: Incumplimiento de obligaciones contractuales y regulatorias
4. **Riesgo competitivo**: Pérdida de ventaja ante competidores certificados
5. **Riesgo financiero**: Pérdidas directas por robo de propiedad intelectual o sabotaje

### 10.4 Valor estratégico de la certificación

Más allá del cumplimiento normativo, la certificación ISO 27001 aporta **valor estratégico** a Industrias Vaine:

- **Diferenciación competitiva**: Requisito cada vez más común en licitaciones gubernamentales
- **Reducción de riesgos**: Framework estructurado para gestión de amenazas
- **Eficiencia operacional**: Procesos documentados y optimizados
- **Confianza de stakeholders**: Demostración objetiva de compromiso con la seguridad
- **Preparación para el futuro**: Base sólida para adoptar estándares adicionales

### 10.5 Mensaje final

Industrias Vaine opera en uno de los entornos de amenaza más hostiles del sector tecnológico. La implementación de un SGSI certificado bajo ISO 27001:2022 **no es opcional, es una necesidad estratégica** para la supervivencia y crecimiento de la organización.

La preauditoría ha identificado brechas significativas, pero también ha confirmado que existen **fortalezas sobre las cuales construir**. Con el compromiso adecuado de la dirección, la asignación de recursos necesarios, y la ejecución disciplinada del roadmap propuesto, Industrias Vaine puede transformar su postura de seguridad y alcanzar la certificación ISO 27001:2022 en el plazo establecido de 12 meses.

**El momento de actuar es ahora**. Cada día de retraso incrementa la exposición a amenazas que pueden comprometer décadas de innovación y desarrollo tecnológico.

---

## 11. Próximos pasos recomendados

1. **Inmediato (Semana 1)**:
   - Presentar informe de preauditoría a Bruno Vaine y comité ejecutivo
   - Obtener aprobación formal del proyecto de implementación SGSI
   - Asignar presupuesto y autorizar contrataciones

2. **Corto plazo (Mes 1)**:
   - Contratar CISO
   - Constituir comité de seguridad de la información
   - Iniciar remediación de vulnerabilidades críticas
   - Implementar MFA en accesos críticos

3. **Mediano plazo (Meses 2-6)**:
   - Ejecutar Fases 1 y 2 del roadmap de implementación
   - Desarrollar y aprobar políticas de seguridad
   - Desplegar controles técnicos prioritarios
   - Iniciar programa de awareness

4. **Largo plazo (Meses 7-12)**:
   - Completar implementación de todos los controles aplicables
   - Realizar auditorías internas
   - Preparar auditoría de certificación
   - Obtener certificación ISO 27001:2022

---

**Documento elaborado por**: [Nombre del auditor]
**Fecha**: [Fecha de emisión]
**Versión**: 1.0
**Clasificación**: CONFIDENCIAL - Uso interno Industrias Vaine

---

*Este informe de preauditoría es un documento preliminar basado en observaciones y entrevistas realizadas durante el proceso de evaluación inicial. Los hallazgos y recomendaciones deben ser validados mediante un análisis de riesgos formal y auditorías más exhaustivas durante la fase de implementación del SGSI.*
