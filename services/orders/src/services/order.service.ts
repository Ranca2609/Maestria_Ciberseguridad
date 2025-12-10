import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  IOrder,
  IOrderSummary,
  ICreateOrderRequest,
  ICreateOrderResponse,
  IListOrdersRequest,
  IListOrdersResponse,
  IGetOrderRequest,
  IGetOrderResponse,
  ICancelOrderRequest,
  ICancelOrderResponse,
  IGetOrderForReceiptRequest,
  IGetOrderForReceiptResponse,
  OrderStatus,
  IBreakdown,
} from '../interfaces/order.interface';
import { InMemoryOrderRepository, InMemoryIdempotencyStore } from '../repositories';

// Interface para el cliente de Pricing Service
interface PricingServiceClient {
  calculatePrice(request: any): any;
}

@Injectable()
export class OrderService implements OnModuleInit {
  private pricingService: PricingServiceClient;

  constructor(
    @Inject('PRICING_PACKAGE') private readonly pricingClient: ClientGrpc,
    private readonly orderRepository: InMemoryOrderRepository,
    private readonly idempotencyStore: InMemoryIdempotencyStore,
  ) {}

  onModuleInit() {
    this.pricingService = this.pricingClient.getService<PricingServiceClient>('PricingService');
  }

  async createOrder(request: ICreateOrderRequest): Promise<ICreateOrderResponse> {
    // Verificar idempotencia
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
            message: 'Idempotency key already used with different payload',
          };
        }
      }
    }

    // Llamar a Pricing Service
    const pricingResponse = await firstValueFrom(
      this.pricingService.calculatePrice({
        originZone: request.originZone,
        destinationZone: request.destinationZone,
        serviceType: request.serviceType,
        packages: request.packages,
        discount: request.discount,
        insuranceEnabled: request.insuranceEnabled,
      }),
    );

    if (!pricingResponse.valid) {
      throw {
        code: 3, // INVALID_ARGUMENT
        message: pricingResponse.errorMessage,
      };
    }

    // Crear orden
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

    this.orderRepository.save(order);

    const response: ICreateOrderResponse = {
      orderId,
      status: OrderStatus.STATUS_ACTIVE,
      createdAt,
      breakdown,
      total: breakdown.total,
    };

    // Guardar en idempotency store
    if (request.idempotencyKey) {
      const payloadHash = InMemoryIdempotencyStore.hashPayload({
        originZone: request.originZone,
        destinationZone: request.destinationZone,
        serviceType: request.serviceType,
        packages: request.packages,
        discount: request.discount,
        insuranceEnabled: request.insuranceEnabled,
      });
      this.idempotencyStore.set(request.idempotencyKey, payloadHash, response);
    }

    return response;
  }

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
}
