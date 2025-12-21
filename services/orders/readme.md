# Orders Service - Servicio de Gestión de Órdenes de QuetzalShip

## Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Arquitectura del Servicio](#arquitectura-del-servicio)
3. [Componentes Principales](#componentes-principales)
4. [Tecnologías y Dependencias](#tecnologías-y-dependencias)
5. [Configuración y Entorno](#configuración-y-entorno)
6. [Interfaces y Tipos de Datos](#interfaces-y-tipos-de-datos)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [API gRPC](#api-grpc)
9. [Patrones de Diseño](#patrones-de-diseño)
10. [Gestión de Estado](#gestión-de-estado)
11. [Manejo de Errores](#manejo-de-errores)
12. [Despliegue con Docker](#despliegue-con-docker)
13. [Testing](#testing)
14. [Mejores Prácticas](#mejores-prácticas)
15. [Troubleshooting](#troubleshooting)

---

## Descripción General

El **Orders Service** es un microservicio crítico dentro de la arquitectura de QuetzalShip que se encarga de gestionar todo el ciclo de vida de las órdenes de envío. Este servicio forma parte de una arquitectura de microservicios basada en **gRPC**, diseñada para ofrecer alta eficiencia, bajo acoplamiento y escalabilidad horizontal.

### Propósito y Responsabilidades

El servicio de órdenes tiene las siguientes responsabilidades principales:

1. **Creación de Órdenes**: Procesa solicitudes de nuevas órdenes de envío, validando los datos de entrada y coordinándose con el servicio de pricing para calcular costos.

2. **Gestión del Ciclo de Vida**: Mantiene el estado de cada orden desde su creación hasta su cancelación, incluyendo estados activos, cancelados y cualquier transición entre ellos.

3. **Consulta de Órdenes**: Proporciona capacidades de consulta tanto para órdenes individuales como para listados paginados de múltiples órdenes.

4. **Cancelación de Órdenes**: Permite la cancelación de órdenes existentes con las validaciones de negocio apropiadas.

5. **Integración con Receipt Service**: Proporciona datos de órdenes para la generación de recibos a través de un endpoint especializado.

6. **Garantías de Idempotencia**: Implementa mecanismos de idempotencia para evitar duplicación de órdenes en escenarios de reintentos de red.

### Contexto en la Arquitectura

El Orders Service opera como un componente central en el ecosistema de QuetzalShip:

```
┌─────────────────┐
│  Gateway/API    │
│   (REST/HTTP)   │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
    ┌────▼──────┐      ┌───▼────────┐
    │  Orders   │──────│  Pricing   │
    │  Service  │ gRPC │  Service   │
    │  :50051   │      │  :50052    │
    └────┬──────┘      └────────────┘
         │
    ┌────▼──────┐
    │  Receipt  │
    │  Service  │
    │  :50054   │
    └───────────┘
```

El servicio se comunica con:

- **Pricing Service**: Para obtener cálculos de precios, tarifas, descuentos y recargos
- **Receipt Service**: Para proporcionar datos de órdenes que serán formateados en recibos
- **Gateway/API**: Que traduce las peticiones HTTP REST en llamadas gRPC

---

## Arquitectura del Servicio

### Arquitectura en Capas

El Orders Service sigue una arquitectura en capas bien definida que separa las responsabilidades:

```
┌─────────────────────────────────────────────┐
│          Capa de Presentación               │
│         (Controllers/gRPC Layer)            │
│  - Recepción de peticiones gRPC             │
│  - Validación de entrada                    │
│  - Manejo de excepciones RPC                │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│        Capa de Lógica de Negocio            │
│            (Service Layer)                  │
│  - Orquestación de operaciones              │
│  - Lógica de negocio                        │
│  - Comunicación con servicios externos      │
│  - Implementación de idempotencia           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Capa de Persistencia                │
│         (Repository Layer)                  │
│  - Gestión de almacenamiento de órdenes     │
│  - Operaciones CRUD                         │
│  - Almacenamiento de claves de idempotencia │
└─────────────────────────────────────────────┘
```

### Arquitectura Hexagonal (Ports & Adapters)

El servicio implementa principios de arquitectura hexagonal:

**Núcleo del Dominio**:

- Entidades: `Order`, `Package`, `Breakdown`
- Interfaces de Repositorio: `IOrderRepository`, `IIdempotencyStore`
- Lógica de negocio: `OrderService`

**Puertos**:

- Puerto de entrada: `OrderController` (gRPC)
- Puerto de salida: Interfaces de repositorio

**Adaptadores**:

- Adaptador de entrada: Implementación gRPC con decoradores NestJS
- Adaptadores de salida: `InMemoryOrderRepository`, `InMemoryIdempotencyStore`

Esta arquitectura permite:

- **Testabilidad**: Fácil mockeo de dependencias
- **Mantenibilidad**: Cambios en adaptadores sin afectar el núcleo
- **Flexibilidad**: Cambio de implementaciones de almacenamiento sin modificar la lógica

### Patrón de Microservicios

El servicio implementa los siguientes patrones de microservicios:

1. **Service Discovery**: Configurado para descubrirse en la red mediante DNS/URLs de servicio
2. **API Gateway Pattern**: Se comunica a través de un gateway que maneja las peticiones externas
3. **Database per Service**: Mantiene su propio almacenamiento independiente
4. **Event-Driven Architecture** (preparado): Diseñado para emitir eventos en futuras iteraciones
5. **Circuit Breaker** (preparado): Estructura lista para implementar resiliencia en llamadas a Pricing Service

---

## Componentes Principales

### 1. Main Bootstrap (main.ts)

El punto de entrada de la aplicación configura el microservicio gRPC:

```typescript
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "orders",
        protoPath: join(__dirname, "../../contracts/proto/orders.proto"),
        url: `0.0.0.0:${process.env.GRPC_PORT || 50051}`,
      },
    }
  );

  await app.listen();
  console.log(
    `Orders Service is running on port ${process.env.GRPC_PORT || 50051}`
  );
}
```

**Responsabilidades**:

- Inicialización del contexto de NestJS para microservicios
- Configuración del transporte gRPC
- Carga del archivo de definición Protocol Buffers (`.proto`)
- Vinculación del servicio a la dirección y puerto especificados
- Arranque del servidor gRPC

**Configuración Importante**:

- **package**: 'orders' - debe coincidir con el package definido en el archivo `.proto`
- **protoPath**: Ruta al archivo de contrato Protocol Buffers
- **url**: Bind address, usando `0.0.0.0` para aceptar conexiones desde cualquier interfaz
- **GRPC_PORT**: Puerto configurable mediante variable de entorno (default: 50051)

### 2. Orders Module (orders.module.ts)

Módulo raíz de NestJS que orquesta todas las dependencias:

```typescript
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "PRICING_PACKAGE",
        transport: Transport.GRPC,
        options: {
          package: "pricing",
          protoPath: join(__dirname, "../../contracts/proto/pricing.proto"),
          url: process.env.PRICING_SERVICE_URL || "localhost:50052",
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, InMemoryOrderRepository, InMemoryIdempotencyStore],
  exports: [OrderService],
})
export class OrdersModule {}
```

**Componentes del Módulo**:

**Imports**:

- `ClientsModule.register`: Configura el cliente gRPC para comunicarse con el Pricing Service
- Permite inyección de dependencias del cliente gRPC en servicios

**Controllers**:

- `OrderController`: Controlador que expone los endpoints gRPC

**Providers**:

- `OrderService`: Servicio principal con la lógica de negocio
- `InMemoryOrderRepository`: Repositorio para persistencia de órdenes
- `InMemoryIdempotencyStore`: Store para claves de idempotencia

**Exports**:

- `OrderService`: Exportado para posible uso en otros módulos

**Configuración de Cliente gRPC**:

- **name**: Token de inyección 'PRICING_PACKAGE'
- **transport**: Transport.GRPC para comunicación binaria eficiente
- **package**: 'pricing' del archivo proto del servicio de pricing
- **protoPath**: Ruta al contrato del servicio de pricing
- **url**: URL del servicio de pricing (configurable vía env)

### 3. Order Controller (order.controller.ts)

Controlador que expone los métodos gRPC como endpoints del servicio:

```typescript
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod("OrdersService", "CreateOrder")
  async createOrder(request: ICreateOrderRequest) {
    try {
      return await this.orderService.createOrder(request);
    } catch (error: any) {
      throw new RpcException({
        code: error.code || 13,
        message: error.message || "Internal error",
      });
    }
  }

  @GrpcMethod("OrdersService", "ListOrders")
  listOrders(request: IListOrdersRequest) {
    /* ... */
  }

  @GrpcMethod("OrdersService", "GetOrder")
  getOrder(request: IGetOrderRequest) {
    /* ... */
  }

  @GrpcMethod("OrdersService", "CancelOrder")
  cancelOrder(request: ICancelOrderRequest) {
    /* ... */
  }

  @GrpcMethod("OrdersService", "GetOrderForReceipt")
  getOrderForReceipt(request: IGetOrderForReceiptRequest) {
    /* ... */
  }
}
```

**Características**:

**Decorador @GrpcMethod**:

- Primer parámetro: Nombre del servicio en el archivo `.proto` ('OrdersService')
- Segundo parámetro: Nombre del método RPC definido en el proto

**Manejo de Errores**:

- Captura errores de la capa de servicio
- Convierte errores en `RpcException` con códigos gRPC estándar
- Proporciona mensajes de error descriptivos
- Código 13 (INTERNAL) como fallback para errores no clasificados

**Responsabilidades**:

- Actuar como adaptador entre el protocolo gRPC y la lógica de negocio
- Delegación de operaciones al `OrderService`
- Transformación de excepciones a formato gRPC
- No contiene lógica de negocio (thin controller pattern)

**Códigos de Error gRPC Utilizados**:

- `3` (INVALID_ARGUMENT): Datos de entrada inválidos
- `5` (NOT_FOUND): Recurso no encontrado
- `6` (ALREADY_EXISTS): Recurso ya existe (idempotencia)
- `9` (FAILED_PRECONDITION): Precondición fallida (ej: cancelar orden ya cancelada)
- `13` (INTERNAL): Error interno del servidor

### 4. Order Service (order.service.ts)

El corazón del servicio, conteniendo toda la lógica de negocio:

**Estructura Principal**:

```typescript
@Injectable()
export class OrderService implements OnModuleInit {
  private pricingService: PricingServiceClient;

  constructor(
    @Inject("PRICING_PACKAGE") private readonly pricingClient: ClientGrpc,
    private readonly orderRepository: InMemoryOrderRepository,
    private readonly idempotencyStore: InMemoryIdempotencyStore
  ) {}

  onModuleInit() {
    this.pricingService =
      this.pricingClient.getService<PricingServiceClient>("PricingService");
  }
}
```

**Inyección de Dependencias**:

- `pricingClient`: Cliente gRPC del servicio de pricing
- `orderRepository`: Repositorio de órdenes
- `idempotencyStore`: Almacén de claves de idempotencia

**Inicialización**:

- `onModuleInit()`: Hook del ciclo de vida de NestJS
- Obtiene el servicio de pricing del cliente gRPC
- Permite llamadas asíncronas al servicio externo

#### Método: createOrder

El método más complejo y crítico del servicio:

**Flujo de Operación**:

1. **Verificación de Idempotencia**:

```typescript
if (request.idempotencyKey) {
  const payloadHash = InMemoryIdempotencyStore.hashPayload({
    originZone: request.originZone,
    destinationZone: request.destinationZone,
    serviceType: request.serviceType,
    packages: request.packages,
    discount: request.discount,
    insuranceEnabled: request.insuranceEnabled,
  });

  const existing = this.idempotencyStore.get(request.idempotencyKey);

  if (existing) {
    if (existing.payloadHash === payloadHash) {
      return existing.response;
    } else {
      throw {
        code: 6, // ALREADY_EXISTS
        message: "Idempotency key already used with different payload",
      };
    }
  }
}
```

**Propósito**: Prevenir duplicación de órdenes en caso de reintentos de red
**Funcionamiento**:

- Calcula un hash SHA-256 del payload de la solicitud
- Busca si la clave de idempotencia ya fue utilizada
- Si existe con el mismo payload, retorna la respuesta anterior (deduplicación)
- Si existe con payload diferente, lanza error (uso indebido de la clave)

2. **Llamada al Pricing Service**:

```typescript
const pricingResponse = await firstValueFrom(
  this.pricingService.calculatePrice({
    originZone: request.originZone,
    destinationZone: request.destinationZone,
    serviceType: request.serviceType,
    packages: request.packages,
    discount: request.discount,
    insuranceEnabled: request.insuranceEnabled,
  })
);
```

**Propósito**: Delegar el cálculo de precios al servicio especializado
**Funcionamiento**:

- Usa `firstValueFrom` de RxJS para convertir Observable en Promise
- Envía todos los parámetros necesarios para el cálculo
- Recibe respuesta con breakdown detallado de costos

3. **Validación de Respuesta de Pricing**:

```typescript
if (!pricingResponse.valid) {
  throw {
    code: 3, // INVALID_ARGUMENT
    message: pricingResponse.errorMessage,
  };
}
```

**Propósito**: Validar que el servicio de pricing aceptó la solicitud
**Funcionamiento**:

- Verifica el campo `valid` de la respuesta
- Si no es válido, propaga el mensaje de error del pricing service
- Usa código 3 (INVALID_ARGUMENT) para indicar problema con los datos

4. **Creación de la Orden**:

```typescript
const orderId = `ord_${uuidv4().slice(0, 12)}`;
const createdAt = new Date().toISOString();

const breakdown: IBreakdown = {
  orderBillableKg: pricingResponse.breakdown.orderBillableKg,
  baseSubtotal: pricingResponse.breakdown.baseSubtotal,
  serviceSubtotal: pricingResponse.breakdown.serviceSubtotal,
  fragileSurcharge: pricingResponse.breakdown.fragileSurcharge,
  insuranceSurcharge: pricingResponse.breakdown.insuranceSurcharge,
  subtotalWithSurcharges: pricingResponse.breakdown.subtotalWithSurcharges,
  discountAmount: pricingResponse.breakdown.discountAmount,
  total: pricingResponse.breakdown.total,
  ratePerKg: pricingResponse.breakdown.ratePerKg,
  serviceMultiplier: pricingResponse.breakdown.serviceMultiplier,
  fragilePackagesCount: pricingResponse.breakdown.fragilePackagesCount,
  declaredValueTotal: pricingResponse.breakdown.declaredValueTotal,
};

const order: IOrder = {
  orderId,
  createdAt,
  originZone: request.originZone,
  destinationZone: request.destinationZone,
  serviceType: request.serviceType,
  packages: request.packages,
  discount: request.discount,
  insuranceEnabled: request.insuranceEnabled,
  status: OrderStatus.STATUS_ACTIVE,
  breakdown,
  total: breakdown.total,
};
```

**Generación de ID**:

- Usa UUID v4 para garantizar unicidad global
- Prefijo 'ord\_' para identificación visual
- Toma solo los primeros 12 caracteres para IDs más compactos

**Timestamp**:

- Formato ISO 8601 para compatibilidad internacional
- Almacenado como string para serialización en gRPC

**Breakdown**:

- Copia completa del breakdown del pricing service
- Incluye todos los detalles de cálculo para auditoría
- Permite entender cómo se llegó al precio final

**Estado Inicial**:

- Todas las órdenes nuevas inician en estado `STATUS_ACTIVE`
- Estado inmutable al momento de creación

5. **Persistencia**:

```typescript
this.orderRepository.save(order);

const response: ICreateOrderResponse = {
  orderId,
  status: OrderStatus.STATUS_ACTIVE,
  createdAt,
  breakdown,
  total: breakdown.total,
};

if (request.idempotencyKey) {
  const payloadHash = InMemoryIdempotencyStore.hashPayload({...});
  this.idempotencyStore.set(request.idempotencyKey, payloadHash, response);
}

return response;
```

**Almacenamiento de Orden**:

- Persiste la orden completa en el repositorio
- Garantiza disponibilidad para futuras consultas

**Almacenamiento de Idempotencia**:

- Solo si se proporcionó una clave de idempotencia
- Guarda el hash del payload y la respuesta
- TTL de 24 horas para limpieza automática

**Respuesta**:

- Retorna solo campos relevantes para el cliente
- Incluye breakdown completo para transparencia
- Formato compatible con el contrato gRPC

#### Método: listOrders

Proporciona listado paginado de órdenes:

```typescript
listOrders(request: IListOrdersRequest): IListOrdersResponse {
  const allOrders = this.orderRepository.findAll();
  const page = request.page || 1;
  const pageSize = Math.min(request.pageSize || 20, 100);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedOrders = allOrders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(startIndex, endIndex);

  const orderSummaries: IOrderSummary[] = paginatedOrders.map(order => ({
    orderId: order.orderId,
    destinationZone: order.destinationZone,
    serviceType: order.serviceType,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt,
  }));

  return {
    orders: orderSummaries,
    totalCount: allOrders.length,
    page,
    pageSize,
  };
}
```

**Características**:

**Paginación**:

- Página por defecto: 1
- Tamaño de página por defecto: 20
- Tamaño máximo de página: 100 (previene sobrecarga)

**Ordenamiento**:

- Ordenadas por fecha de creación, más recientes primero
- Usa timestamps convertidos a milisegundos para comparación numérica

**Proyección**:

- Retorna `OrderSummary` en lugar de `Order` completo
- Reduce payload de red considerablemente
- Incluye solo campos relevantes para listados

**Metadatos de Paginación**:

- `totalCount`: Total de órdenes en el sistema
- `page`: Página actual
- `pageSize`: Tamaño de página utilizado
- Permite construir controles de paginación en el cliente

#### Método: getOrder

Obtiene una orden específica por ID:

```typescript
getOrder(request: IGetOrderRequest): IGetOrderResponse {
  const order = this.orderRepository.findById(request.orderId);

  if (!order) {
    throw {
      code: 5, // NOT_FOUND
      message: `Order ${request.orderId} not found`,
    };
  }

  return { order };
}
```

**Características**:

- Búsqueda directa por ID
- Error 404 (NOT_FOUND) si no existe
- Retorna orden completa con todos los detalles
- Operación de lectura sin efectos secundarios

#### Método: cancelOrder

Cancela una orden existente:

```typescript
cancelOrder(request: ICancelOrderRequest): ICancelOrderResponse {
  const order = this.orderRepository.findById(request.orderId);

  if (!order) {
    throw {
      code: 5, // NOT_FOUND
      message: `Order ${request.orderId} not found`,
    };
  }

  if (order.status === OrderStatus.STATUS_CANCELLED) {
    throw {
      code: 9, // FAILED_PRECONDITION
      message: `Order ${request.orderId} is already cancelled`,
    };
  }

  const cancelledAt = new Date().toISOString();
  order.status = OrderStatus.STATUS_CANCELLED;
  order.cancelledAt = cancelledAt;

  this.orderRepository.update(order);

  return {
    orderId: order.orderId,
    status: OrderStatus.STATUS_CANCELLED,
    cancelledAt,
  };
}
```

**Validaciones de Negocio**:

1. **Existencia**: Verifica que la orden existe
2. **Idempotencia**: Verifica que no está ya cancelada
3. **Estado válido**: Solo órdenes activas pueden cancelarse

**Mutación de Estado**:

- Cambia status a `STATUS_CANCELLED`
- Añade timestamp de cancelación
- Persistencia de cambios en el repositorio

**Respuesta**:

- Confirmación de ID
- Nuevo estado
- Timestamp de cancelación

#### Método: getOrderForReceipt

Método especializado para el Receipt Service:

```typescript
getOrderForReceipt(request: IGetOrderForReceiptRequest): IGetOrderForReceiptResponse {
  const order = this.orderRepository.findById(request.orderId);

  if (!order) {
    throw {
      code: 5, // NOT_FOUND
      message: `Order ${request.orderId} not found`,
    };
  }

  return { order };
}
```

**Propósito**:

- Endpoint dedicado para integración con Receipt Service
- Permite evolución independiente del contrato
- Separación de concerns entre servicios

**Diferencia con getOrder**:

- Semánticamente diferente (propósito específico)
- Puede incluir lógica adicional en el futuro (ej: validaciones)
- Permite control de acceso diferenciado

### 5. Order Repository (order.repository.ts)

Implementación en memoria del patrón Repository:

```typescript
@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, IOrder> = new Map();

  save(order: IOrder): IOrder {
    this.orders.set(order.orderId, { ...order });
    return order;
  }

  findById(orderId: string): IOrder | null {
    const order = this.orders.get(orderId);
    return order ? { ...order } : null;
  }

  findAll(): IOrder[] {
    return Array.from(this.orders.values()).map((order) => ({ ...order }));
  }

  update(order: IOrder): IOrder {
    if (!this.orders.has(order.orderId)) {
      throw new Error(`Order ${order.orderId} not found`);
    }
    this.orders.set(order.orderId, { ...order });
    return order;
  }

  clear(): void {
    this.orders.clear();
  }
}
```

**Características de Implementación**:

**Almacenamiento**:

- Utiliza `Map<string, IOrder>` para O(1) en búsquedas
- Más eficiente que arrays para grandes volúmenes

**Inmutabilidad**:

- Usa spread operator (`{...order}`) para crear copias
- Previene modificaciones accidentales
- Facilita debugging y testing

**Operaciones CRUD**:

- `save`: Creación y actualización idempotente
- `findById`: Búsqueda por clave primaria
- `findAll`: Obtención de todas las órdenes
- `update`: Actualización con validación de existencia
- `clear`: Limpieza (útil para tests)

**Ventajas de este Patrón**:

- Abstracción de la capa de persistencia
- Fácil reemplazo por implementación con base de datos real
- Testabilidad: fácil mockeo
- Adherencia al principio de inversión de dependencias

**Limitaciones Actuales**:

- Datos solo en memoria (se pierden al reiniciar)
- No persistente
- No escalable horizontalmente
- Adecuado para desarrollo y testing

**Migración Futura**:
Para producción, se puede implementar:

- PostgreSQL con TypeORM
- MongoDB con Mongoose
- Redis para cache distribuido
- Sin cambiar la interfaz ni el código del servicio

### 6. Idempotency Store (idempotency.store.ts)

Implementación del patrón Idempotency Key:

```typescript
interface IdempotencyEntry {
  payloadHash: string;
  response: ICreateOrderResponse;
  createdAt: Date;
}

@Injectable()
export class InMemoryIdempotencyStore implements IIdempotencyStore {
  private store: Map<string, IdempotencyEntry> = new Map();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

  get(
    key: string
  ): { payloadHash: string; response: ICreateOrderResponse } | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Verificar TTL
    if (Date.now() - entry.createdAt.getTime() > this.TTL_MS) {
      this.store.delete(key);
      return null;
    }

    return {
      payloadHash: entry.payloadHash,
      response: entry.response,
    };
  }

  set(key: string, payloadHash: string, response: ICreateOrderResponse): void {
    this.store.set(key, {
      payloadHash,
      response,
      createdAt: new Date(),
    });
  }

  static hashPayload(payload: any): string {
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
  }

  clear(): void {
    this.store.clear();
  }
}
```

**Propósito**: Implementar garantías de idempotencia en operaciones de creación

**Funcionamiento**:

**Entrada de Idempotencia**:

- `payloadHash`: Hash SHA-256 del contenido de la petición
- `response`: Respuesta original guardada
- `createdAt`: Timestamp para TTL

**Método get**:

- Busca por clave de idempotencia
- Verifica TTL (24 horas)
- Limpia entradas expiradas automáticamente
- Retorna null si no existe o expiró

**Método set**:

- Almacena nueva entrada
- Asocia hash de payload con respuesta
- Registra timestamp de creación

**Método hashPayload**:

- Método estático para calcular hash
- Usa algoritmo SHA-256 (criptográficamente seguro)
- Serializa objeto a JSON para hashing
- Retorna hash hexadecimal

**TTL (Time To Live)**:

- 24 horas por defecto
- Balancea entre garantías de idempotencia y uso de memoria
- Previene crecimiento infinito del store

**Casos de Uso**:

1. **Reintento de Cliente**:

```
Cliente → CreateOrder(idempotencyKey: "abc123", {...})
Servicio → Procesa y guarda respuesta
Cliente (timeout) → CreateOrder(idempotencyKey: "abc123", {...})
Servicio → Detecta clave, retorna respuesta guardada ✓
```

2. **Detección de Uso Indebido**:

```
Cliente → CreateOrder(idempotencyKey: "abc123", {data1})
Servicio → Procesa y guarda
Cliente → CreateOrder(idempotencyKey: "abc123", {data2})
Servicio → Detecta hash diferente, lanza error ✗
```

---

## Tecnologías y Dependencias

### Stack Tecnológico

**Runtime y Framework**:

- **Node.js 20**: Runtime de JavaScript basado en V8
- **TypeScript 5.0+**: Superset tipado de JavaScript
- **NestJS 10**: Framework progresivo para Node.js
  - Arquitectura modular
  - Inyección de dependencias
  - Decoradores y metaprogramación
  - Soporte nativo para microservicios

**Protocolo de Comunicación**:

- **gRPC (@grpc/grpc-js 1.9.0)**: Framework RPC de alto rendimiento
  - Comunicación binaria eficiente
  - Definición de contratos con Protocol Buffers
  - Streaming bidireccional
  - Generación automática de clientes

**Dependencias Principales**:

```json
{
  "@grpc/grpc-js": "^1.9.0", // Cliente y servidor gRPC
  "@grpc/proto-loader": "^0.7.0", // Cargador de archivos .proto
  "@nestjs/common": "^10.0.0", // Decoradores y utilidades
  "@nestjs/core": "^10.0.0", // Núcleo del framework
  "@nestjs/microservices": "^10.0.0", // Soporte para microservicios
  "@nestjs/platform-express": "^10.0.0", // Adaptador Express
  "reflect-metadata": "^0.1.13", // Metadata para decoradores
  "rxjs": "^7.8.0", // Programación reactiva
  "uuid": "^9.0.0" // Generación de UUIDs
}
```

**Herramientas de Desarrollo**:

```json
{
  "@nestjs/cli": "^10.0.0", // CLI de NestJS
  "@nestjs/testing": "^10.0.0", // Utilidades de testing
  "@types/jest": "^29.5.0", // Tipos para Jest
  "@types/node": "^20.0.0", // Tipos para Node.js
  "@types/uuid": "^9.0.0", // Tipos para UUID
  "@typescript-eslint/eslint-plugin": "^6.0.0", // Linting TypeScript
  "@typescript-eslint/parser": "^6.0.0", // Parser ESLint
  "eslint": "^8.0.0", // Linter
  "jest": "^29.5.0", // Framework de testing
  "ts-jest": "^29.1.0", // Preset Jest para TS
  "ts-node": "^10.9.0", // Ejecutor TypeScript
  "typescript": "^5.0.0" // Compilador TypeScript
}
```

### Configuración de TypeScript

El archivo `tsconfig.json` configura el compilador:

```jsonc
{
  "compilerOptions": {
    "module": "commonjs", // Módulos CommonJS (Node.js)
    "declaration": true, // Genera archivos .d.ts
    "removeComments": true, // Elimina comentarios
    "emitDecoratorMetadata": true, // Emite metadata de decoradores
    "experimentalDecorators": true, // Habilita decoradores
    "allowSyntheticDefaultImports": true, // Imports default sintéticos
    "target": "ES2021", // Target JavaScript
    "sourceMap": true, // Genera source maps
    "outDir": "./dist", // Directorio de salida
    "baseUrl": "./", // Base para imports relativos
    "incremental": true, // Compilación incremental
    "skipLibCheck": true, // Skip check de .d.ts
    "strictNullChecks": true, // Checks estrictos de null
    "noImplicitAny": true, // No permite any implícito
    "strictBindCallApply": true, // Checks de bind/call/apply
    "forceConsistentCasingInFileNames": true, // Consistencia de nombres
    "noFallthroughCasesInSwitch": true, // Previene fallthrough
    "esModuleInterop": true // Interop ES modules
  }
}
```

**Características Importantes**:

- **Decoradores**: Fundamentales para NestJS
- **Strict Checks**: Prevención de errores comunes
- **Source Maps**: Debugging de TypeScript
- **Incremental**: Compilaciones más rápidas

### Configuración de NestJS CLI

El archivo `nest-cli.json` configura el CLI:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "assets": ["**/*.proto"], // Copia archivos .proto al build
    "watchAssets": true // Observa cambios en assets
  }
}
```

**Importancia**:

- Copia automática de archivos `.proto` al directorio de build
- Observación de cambios en desarrollo
- Regeneración automática en watch mode

### Scripts NPM

```json
{
  "build": "nest build", // Compila el proyecto
  "start": "nest start", // Inicia en modo producción
  "start:dev": "nest start --watch", // Inicia en modo desarrollo
  "start:prod": "node dist/main", // Inicia build de producción
  "test": "jest", // Ejecuta tests
  "test:watch": "jest --watch", // Tests en watch mode
  "test:cov": "jest --coverage", // Tests con coverage
  "lint": "eslint \"{src,test}/**/*.ts\" --fix" // Linting
}
```

---

## Configuración y Entorno

### Variables de Entorno

El servicio utiliza las siguientes variables de entorno:

**GRPC_PORT** (opcional):

- Puerto en el que el servicio escucha peticiones gRPC
- Default: `50051`
- Ejemplo: `GRPC_PORT=50051`
- Uso: Permite múltiples instancias en diferentes puertos

**PRICING_SERVICE_URL** (opcional):

- URL del servicio de pricing para comunicación gRPC
- Default: `localhost:50052`
- Formato: `host:port`
- Ejemplos:
  - Desarrollo: `localhost:50052`
  - Docker Compose: `pricing:50052`
  - Kubernetes: `pricing-service.default.svc.cluster.local:50052`

**NODE_ENV** (opcional):

- Entorno de ejecución
- Valores: `development`, `production`, `test`
- Default: `development`
- Afecta logging, optimizaciones, etc.

### Configuración para Diferentes Entornos

**Desarrollo Local**:

```bash
GRPC_PORT=50051
PRICING_SERVICE_URL=localhost:50052
NODE_ENV=development
```

**Docker Compose**:

```yaml
environment:
  - GRPC_PORT=50051
  - PRICING_SERVICE_URL=pricing:50052
  - NODE_ENV=production
```

**Kubernetes**:

```yaml
env:
  - name: GRPC_PORT
    value: "50051"
  - name: PRICING_SERVICE_URL
    value: "pricing-service:50052"
  - name: NODE_ENV
    value: "production"
```

---

## Interfaces y Tipos de Datos

### Definición Protocol Buffers

El contrato del servicio está definido en `contracts/proto/orders.proto`:

**Servicio Principal**:

```protobuf
service OrdersService {
  rpc CreateOrder(CreateOrderRequest) returns (CreateOrderResponse);
  rpc ListOrders(ListOrdersRequest) returns (ListOrdersResponse);
  rpc GetOrder(GetOrderRequest) returns (GetOrderResponse);
  rpc CancelOrder(CancelOrderRequest) returns (CancelOrderResponse);
  rpc GetOrderForReceipt(GetOrderForReceiptRequest) returns (GetOrderForReceiptResponse);
}
```

**Enumeraciones**:

```protobuf
enum OrderStatus {
  STATUS_UNSPECIFIED = 0;  // Valor por defecto (no usar)
  STATUS_ACTIVE = 1;       // Orden activa
  STATUS_CANCELLED = 2;    // Orden cancelada
}
```

**Mensajes Principales**:

**Package**: Representa un paquete individual

```protobuf
message Package {
  double weight_kg = 1;         // Peso en kilogramos
  double height_cm = 2;         // Alto en centímetros
  double width_cm = 3;          // Ancho en centímetros
  double length_cm = 4;         // Largo en centímetros
  bool fragile = 5;             // Indica si es frágil
  double declared_value_q = 6;  // Valor declarado en quetzales
}
```

**Discount**: Información de descuento

```protobuf
message Discount {
  pricing.DiscountType type = 1;  // Tipo: PERCENTAGE o FIXED
  double value = 2;                // Valor del descuento
}
```

**Breakdown**: Desglose detallado de costos

```protobuf
message Breakdown {
  double order_billable_kg = 1;           // Kg facturables totales
  double base_subtotal = 2;               // Subtotal base
  double service_subtotal = 3;            // Subtotal con multiplicador
  double fragile_surcharge = 4;           // Recargo por fragilidad
  double insurance_surcharge = 5;         // Recargo por seguro
  double subtotal_with_surcharges = 6;    // Subtotal con recargos
  double discount_amount = 7;             // Monto descontado
  double total = 8;                       // Total final
  double rate_per_kg = 9;                 // Tarifa por kg
  double service_multiplier = 10;         // Multiplicador de servicio
  int32 fragile_packages_count = 11;      // Cantidad de paquetes frágiles
  double declared_value_total = 12;       // Suma de valores declarados
}
```

**Order**: Entidad completa de orden

```protobuf
message Order {
  string order_id = 1;                    // ID único de la orden
  string created_at = 2;                  // Timestamp ISO 8601
  pricing.Zone origin_zone = 3;           // Zona de origen
  pricing.Zone destination_zone = 4;      // Zona de destino
  pricing.ServiceType service_type = 5;   // Tipo de servicio
  repeated Package packages = 6;          // Lista de paquetes
  Discount discount = 7;                  // Descuento aplicado
  bool insurance_enabled = 8;             // Seguro habilitado
  OrderStatus status = 9;                 // Estado de la orden
  Breakdown breakdown = 10;               // Desglose de costos
  double total = 11;                      // Total (duplicado para conveniencia)
}
```

**OrderSummary**: Versión resumida de orden (para listados)

```protobuf
message OrderSummary {
  string order_id = 1;
  pricing.Zone destination_zone = 2;
  pricing.ServiceType service_type = 3;
  OrderStatus status = 4;
  double total = 5;
  string created_at = 6;
}
```

### Mensajes de Request/Response

**CreateOrder**:

```protobuf
message CreateOrderRequest {
  pricing.Zone origin_zone = 1;
  pricing.Zone destination_zone = 2;
  pricing.ServiceType service_type = 3;
  repeated Package packages = 4;
  Discount discount = 5;
  bool insurance_enabled = 6;
  string idempotency_key = 7;  // Opcional, para idempotencia
}

message CreateOrderResponse {
  string order_id = 1;
  OrderStatus status = 2;
  string created_at = 3;
  Breakdown breakdown = 4;
  double total = 5;
}
```

**ListOrders**:

```protobuf
message ListOrdersRequest {
  int32 page = 1;       // Número de página (1-based)
  int32 page_size = 2;  // Tamaño de página (max: 100)
}

message ListOrdersResponse {
  repeated OrderSummary orders = 1;  // Lista de órdenes
  int32 total_count = 2;              // Total de órdenes
  int32 page = 3;                     // Página actual
  int32 page_size = 4;                // Tamaño de página usado
}
```

**GetOrder**:

```protobuf
message GetOrderRequest {
  string order_id = 1;
}

message GetOrderResponse {
  Order order = 1;
}
```

**CancelOrder**:

```protobuf
message CancelOrderRequest {
  string order_id = 1;
}

message CancelOrderResponse {
  string order_id = 1;
  OrderStatus status = 2;
  string cancelled_at = 3;  // Timestamp de cancelación
}
```

**GetOrderForReceipt**:

```protobuf
message GetOrderForReceiptRequest {
  string order_id = 1;
}

message GetOrderForReceiptResponse {
  Order order = 1;
}
```

### Interfaces TypeScript

Aunque Protocol Buffers define el contrato, el código TypeScript utiliza interfaces para type safety:

```typescript
interface IOrder {
  orderId: string;
  createdAt: string;
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: IPackage[];
  discount?: IDiscount;
  insuranceEnabled: boolean;
  status: OrderStatus;
  breakdown: IBreakdown;
  total: number;
  cancelledAt?: string;
}

interface IPackage {
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  fragile: boolean;
  declaredValueQ: number;
}

interface IBreakdown {
  orderBillableKg: number;
  baseSubtotal: number;
  serviceSubtotal: number;
  fragileSurcharge: number;
  insuranceSurcharge: number;
  subtotalWithSurcharges: number;
  discountAmount: number;
  total: number;
  ratePerKg: number;
  serviceMultiplier: number;
  fragilePackagesCount: number;
  declaredValueTotal: number;
}

enum OrderStatus {
  STATUS_UNSPECIFIED = 0,
  STATUS_ACTIVE = 1,
  STATUS_CANCELLED = 2,
}
```

---

## Flujos de Trabajo

### Flujo: Creación de Orden

```
┌─────────┐        ┌─────────┐        ┌─────────┐        ┌─────────┐
│ Cliente │        │ Orders  │        │ Pricing │        │ Receipt │
│         │        │ Service │        │ Service │        │ Service │
└────┬────┘        └────┬────┘        └────┬────┘        └────┬────┘
     │                  │                  │                  │
     │ CreateOrder      │                  │                  │
     │ (idempotencyKey) │                  │                  │
     ├─────────────────>│                  │                  │
     │                  │                  │                  │
     │                  │ 1. Check         │                  │
     │                  │ Idempotency      │                  │
     │                  │ Store            │                  │
     │                  │                  │                  │
     │                  │ 2. CalculatePrice│                  │
     │                  ├─────────────────>│                  │
     │                  │                  │                  │
     │                  │ PricingResponse  │                  │
     │                  │<─────────────────┤                  │
     │                  │                  │                  │
     │                  │ 3. Validate      │                  │
     │                  │ Response         │                  │
     │                  │                  │                  │
     │                  │ 4. Generate      │                  │
     │                  │ Order ID         │                  │
     │                  │                  │                  │
     │                  │ 5. Save Order    │                  │
     │                  │                  │                  │
     │                  │ 6. Save          │                  │
     │                  │ Idempotency      │                  │
     │                  │                  │                  │
     │ CreateOrderResp  │                  │                  │
     │<─────────────────┤                  │                  │
     │                  │                  │                  │
```

**Pasos Detallados**:

1. **Recepción de Solicitud**: Cliente envía CreateOrderRequest
2. **Verificación de Idempotencia**: Si incluye clave, verifica store
3. **Llamada a Pricing**: Solicita cálculo de precio
4. **Validación**: Verifica respuesta válida de pricing
5. **Generación de ID**: Crea ID único para la orden
6. **Construcción de Entidad**: Crea objeto Order completo
7. **Persistencia**: Guarda en repositorio
8. **Almacenamiento de Idempotencia**: Guarda respuesta en store
9. **Respuesta**: Retorna CreateOrderResponse al cliente

### Flujo: Listado Paginado

```
┌─────────┐        ┌─────────┐
│ Cliente │        │ Orders  │
│         │        │ Service │
└────┬────┘        └────┬────┘
     │                  │
     │ ListOrders       │
     │ (page=2,         │
     │  pageSize=20)    │
     ├─────────────────>│
     │                  │
     │                  │ 1. Get All Orders
     │                  │
     │                  │ 2. Sort by Date DESC
     │                  │
     │                  │ 3. Paginate
     │                  │    (startIndex=20,
     │                  │     endIndex=40)
     │                  │
     │                  │ 4. Project to Summary
     │                  │
     │ ListOrdersResp   │
     │ (20 summaries,   │
     │  totalCount=150) │
     │<─────────────────┤
     │                  │
```

### Flujo: Cancelación de Orden

```
┌─────────┐        ┌─────────┐
│ Cliente │        │ Orders  │
│         │        │ Service │
└────┬────┘        └────┬────┘
     │                  │
     │ CancelOrder      │
     │ (orderId)        │
     ├─────────────────>│
     │                  │
     │                  │ 1. Find Order
     │                  │
     │                  │ 2. Validate Exists
     │                  │
     │                  │ 3. Validate Not Cancelled
     │                  │
     │                  │ 4. Update Status
     │                  │    to CANCELLED
     │                  │
     │                  │ 5. Set cancelledAt
     │                  │
     │                  │ 6. Persist Changes
     │                  │
     │ CancelOrderResp  │
     │<─────────────────┤
     │                  │
```

---

## Despliegue con Docker

### Dockerfile Multi-Stage

El servicio usa un Dockerfile optimizado de dos etapas:

**Stage 1: Builder**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build
```

**Propósito**:

- Instalar todas las dependencias (dev + prod)
- Compilar TypeScript a JavaScript
- Generar archivos en directorio `dist/`

**Stage 2: Production**

```dockerfile
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy built application and proto files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Set environment variables
ENV NODE_ENV=production
ENV GRPC_PORT=50052
ENV PRICING_SERVICE_URL=pricing:50051

# Expose gRPC port
EXPOSE 50052

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const grpc = require('@grpc/grpc-js'); const client = new grpc.Client('localhost:50052', grpc.credentials.createInsecure()); client.waitForReady(Date.now() + 5000, (err) => process.exit(err ? 1 : 0));" || exit 1

# Start the application
CMD ["node", "dist/main.js"]
```

**Optimizaciones**:

- Solo dependencias de producción en imagen final
- Imagen base Alpine (ligera)
- Multi-stage reduce tamaño final
- Health check para orquestadores

**Health Check**:

- Verifica conectividad gRPC
- Intervalo de 30 segundos
- Timeout de 10 segundos
- Periodo de inicio de 5 segundos
- 3 reintentos antes de marcar unhealthy

### Construcción de Imagen

```bash
# Construcción básica
docker build -t orders-service:latest .

# Construcción con tag específico
docker build -t orders-service:1.0.0 .

# Construcción sin cache
docker build --no-cache -t orders-service:latest .
```

### Ejecución con Docker

```bash
# Ejecutar contenedor
docker run -d \
  --name orders-service \
  -p 50051:50051 \
  -e GRPC_PORT=50051 \
  -e PRICING_SERVICE_URL=pricing:50052 \
  -e NODE_ENV=production \
  orders-service:latest

# Ver logs
docker logs orders-service

# Ver logs en tiempo real
docker logs -f orders-service

# Inspeccionar salud
docker inspect orders-service | grep Health
```

### Docker Compose

Ejemplo de configuración en `docker-compose.yml`:

```yaml
version: "3.8"

services:
  orders:
    build:
      context: ./services/orders
      dockerfile: Dockerfile
    container_name: orders-service
    ports:
      - "50051:50051"
    environment:
      - GRPC_PORT=50051
      - PRICING_SERVICE_URL=pricing:50052
      - NODE_ENV=production
    depends_on:
      - pricing
    networks:
      - quetzalship-network
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "const grpc = require('@grpc/grpc-js'); /* ... */",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

  pricing:
    # ... configuración del servicio de pricing

networks:
  quetzalship-network:
    driver: bridge
```

**Comandos**:

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs de orders
docker-compose logs -f orders

# Reiniciar orders
docker-compose restart orders

# Detener todos los servicios
docker-compose down
```

---

## Testing

### Configuración de Jest

El proyecto está configurado para testing con Jest:

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["src/**/*.(t|j)s"],
    "coverageDirectory": "./coverage",
    "testEnvironment": "node"
  }
}
```

### Ejemplo de Test Unitario

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { OrderService } from "./order.service";
import { InMemoryOrderRepository } from "../repositories/order.repository";
import { InMemoryIdempotencyStore } from "../repositories/idempotency.store";

describe("OrderService", () => {
  let service: OrderService;
  let repository: InMemoryOrderRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        InMemoryOrderRepository,
        InMemoryIdempotencyStore,
        {
          provide: "PRICING_PACKAGE",
          useValue: {
            getService: jest.fn(() => ({
              calculatePrice: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    repository = module.get<InMemoryOrderRepository>(InMemoryOrderRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("listOrders", () => {
    it("should return paginated orders", () => {
      // Arrange
      const mockOrders = [
        /* ... */
      ];
      jest.spyOn(repository, "findAll").mockReturnValue(mockOrders);

      // Act
      const result = service.listOrders({ page: 1, pageSize: 10 });

      // Assert
      expect(result.orders).toHaveLength(10);
      expect(result.totalCount).toBe(mockOrders.length);
    });
  });
});
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:cov

# Tests de un archivo específico
npm test -- order.service.spec.ts
```

---

## Mejores Prácticas

### 1. Manejo de Errores

**Usar Códigos gRPC Apropiados**:

```typescript
// ✓ Correcto
throw {
  code: 5, // NOT_FOUND
  message: `Order ${orderId} not found`,
};

// ✗ Incorrecto
throw new Error(`Order ${orderId} not found`);
```

**Códigos Comunes**:

- `3` INVALID_ARGUMENT: Parámetros inválidos
- `5` NOT_FOUND: Recurso no encontrado
- `6` ALREADY_EXISTS: Recurso ya existe
- `9` FAILED_PRECONDITION: Estado inválido para operación
- `13` INTERNAL: Error interno

### 2. Idempotencia

**Siempre Usar Claves de Idempotencia en Operaciones de Escritura**:

```typescript
// ✓ Cliente bien implementado
const idempotencyKey = generateUUID();
const response = await createOrder({
  ...orderData,
  idempotencyKey,
});

// En caso de reintento
const retryResponse = await createOrder({
  ...orderData,
  idempotencyKey, // Misma clave
});
// retryResponse === response
```

### 3. Validación

**Validar en Múltiples Capas**:

1. Validación de tipos (Protocol Buffers)
2. Validación de negocio (Service Layer)
3. Validación de estado (Repository Layer)

### 4. Logging

**Implementar Logging Estructurado**:

```typescript
logger.info("Order created", {
  orderId,
  total,
  timestamp: new Date().toISOString(),
});
```

### 5. Monitoreo

**Métricas Importantes**:

- Tasa de creación de órdenes
- Latencia de llamadas a Pricing Service
- Tasa de errores
- Uso de memoria
- Tamaño del idempotency store

---

## Troubleshooting

### Problemas Comunes

**1. Error: "Cannot connect to Pricing Service"**

Causa: URL incorrecta o servicio de pricing no disponible

Solución:

```bash
# Verificar conectividad
docker exec orders-service ping pricing

# Verificar variable de entorno
docker exec orders-service env | grep PRICING_SERVICE_URL

# Actualizar URL
docker run -e PRICING_SERVICE_URL=pricing:50052 ...
```

**2. Error: "Idempotency key already used"**

Causa: Reuso de clave de idempotencia con payload diferente

Solución:

- Generar nueva clave para cada nueva orden
- Usar misma clave solo para reintentos de la misma orden

**3. Memory Leak**

Causa: Idempotency store creciendo sin límite

Solución:

- TTL está configurado (24h)
- Implementar limpieza periódica
- Considerar Redis para producción

**4. High Latency**

Causa: Llamadas síncronas a Pricing Service

Solución:

- Implementar circuit breaker
- Añadir timeout a llamadas gRPC
- Considerar cache de precios

---

## Conclusión

El Orders Service es un componente fundamental de la arquitectura de QuetzalShip, implementando patrones modernos de microservicios con gRPC, NestJS y TypeScript. Su diseño modular, arquitectura en capas y separación de responsabilidades lo hacen mantenible, testeable y escalable.

Las implementaciones de idempotencia, manejo robusto de errores y comunicación eficiente con servicios externos garantizan la fiabilidad y consistencia del sistema en escenarios de producción.

El servicio está preparado para evolucionar, con abstracciones que permiten migrar fácilmente a bases de datos persistentes, añadir nuevas funcionalidades y escalar horizontalmente según las necesidades del negocio.
