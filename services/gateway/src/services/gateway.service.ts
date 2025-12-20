import { Injectable, OnModuleInit, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, timeout, retry, catchError, Observable } from 'rxjs';
import {
  CreateOrderDto,
  Zone,
  ServiceType,
  DiscountType,
  OrderStatus,
} from '../dto';

// gRPC Response interfaces
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

interface IOrderSummary {
  orderId: string;
  destinationZone: number;
  serviceType: number;
  status: number;
  total: number;
  createdAt: string;
}

interface IOrder {
  orderId: string;
  createdAt: string;
  originZone: number;
  destinationZone: number;
  serviceType: number;
  packages: any[];
  discount?: { type: number; value: number };
  insuranceEnabled: boolean;
  status: number;
  breakdown: IBreakdown;
  total: number;
}

interface ICreateOrderResponse {
  orderId: string;
  status: number;
  createdAt: string;
  breakdown: IBreakdown;
  total: number;
}

interface IListOrdersResponse {
  orders: IOrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface IGetOrderResponse {
  order: IOrder;
}

interface ICancelOrderResponse {
  orderId: string;
  status: number;
  cancelledAt: string;
}

interface IReceiptResponse {
  receipt: string;
}

// gRPC Enum mappings
const ZONE_TO_GRPC: Record<Zone, number> = {
  [Zone.METRO]: 1,
  [Zone.INTERIOR]: 2,
  [Zone.FRONTERA]: 3,
};

const GRPC_TO_ZONE: Record<number, Zone> = {
  1: Zone.METRO,
  2: Zone.INTERIOR,
  3: Zone.FRONTERA,
};

const SERVICE_TO_GRPC: Record<ServiceType, number> = {
  [ServiceType.STANDARD]: 1,
  [ServiceType.EXPRESS]: 2,
  [ServiceType.SAME_DAY]: 3,
};

const GRPC_TO_SERVICE: Record<number, ServiceType> = {
  1: ServiceType.STANDARD,
  2: ServiceType.EXPRESS,
  3: ServiceType.SAME_DAY,
};

const DISCOUNT_TO_GRPC: Record<DiscountType, number> = {
  [DiscountType.NONE]: 0,
  [DiscountType.PERCENT]: 1,
  [DiscountType.FIXED]: 2,
};

const GRPC_TO_DISCOUNT: Record<number, DiscountType> = {
  0: DiscountType.NONE,
  1: DiscountType.PERCENT,
  2: DiscountType.FIXED,
};

const GRPC_TO_STATUS: Record<number, OrderStatus> = {
  1: OrderStatus.ACTIVE,
  2: OrderStatus.CANCELLED,
};

// gRPC Service interfaces
interface OrdersServiceClient {
  createOrder(request: any): Observable<ICreateOrderResponse>;
  listOrders(request: any): Observable<IListOrdersResponse>;
  getOrder(request: any): Observable<IGetOrderResponse>;
  cancelOrder(request: any): Observable<ICancelOrderResponse>;
  getOrderForReceipt(request: any): Observable<IGetOrderResponse>;
}

interface ReceiptServiceClient {
  generateReceipt(request: any): Observable<IReceiptResponse>;
}

@Injectable()
export class GatewayService implements OnModuleInit {
  private ordersService: OrdersServiceClient;
  private receiptService: ReceiptServiceClient;

  private readonly TIMEOUT_MS = parseInt(process.env.GRPC_TIMEOUT_MS || '2000');
  private readonly MAX_RETRIES = 2;

  constructor(
    @Inject('ORDERS_PACKAGE') private readonly ordersClient: ClientGrpc,
    @Inject('RECEIPT_PACKAGE') private readonly receiptClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.ordersService = this.ordersClient.getService<OrdersServiceClient>('OrdersService');
    this.receiptService = this.receiptClient.getService<ReceiptServiceClient>('ReceiptService');
  }

  async createOrder(dto: CreateOrderDto, idempotencyKey?: string) {
    const request = {
      originZone: ZONE_TO_GRPC[dto.originZone],
      destinationZone: ZONE_TO_GRPC[dto.destinationZone],
      serviceType: SERVICE_TO_GRPC[dto.serviceType],
      packages: dto.packages.map(pkg => ({
        weightKg: pkg.weightKg,
        heightCm: pkg.heightCm,
        widthCm: pkg.widthCm,
        lengthCm: pkg.lengthCm,
        fragile: pkg.fragile,
        declaredValueQ: pkg.declaredValueQ,
      })),
      discount: dto.discount ? {
        type: DISCOUNT_TO_GRPC[dto.discount.type],
        value: dto.discount.value,
      } : undefined,
      insuranceEnabled: dto.insuranceEnabled,
      idempotencyKey,
    };

    try {
      const response = await firstValueFrom(
        this.ordersService.createOrder(request).pipe(
          timeout(this.TIMEOUT_MS),
          retry({ count: this.MAX_RETRIES, delay: 100 }),
          catchError(err => {
            throw this.mapGrpcError(err);
          }),
        ),
      );

      return {
        orderId: response.orderId,
        status: GRPC_TO_STATUS[response.status] || OrderStatus.ACTIVE,
        createdAt: response.createdAt,
        breakdown: response.breakdown,
        total: response.total,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async listOrders(page: number, pageSize: number) {
    try {
      const response = await firstValueFrom(
        this.ordersService.listOrders({ page, pageSize }).pipe(
          timeout(this.TIMEOUT_MS),
          retry({ count: this.MAX_RETRIES, delay: 100 }),
          catchError(err => {
            throw this.mapGrpcError(err);
          }),
        ),
      );

      return {
        orders: (response.orders || []).map((order: any) => ({
          orderId: order.orderId,
          destinationZone: GRPC_TO_ZONE[order.destinationZone],
          serviceType: GRPC_TO_SERVICE[order.serviceType],
          status: GRPC_TO_STATUS[order.status],
          total: order.total,
          createdAt: order.createdAt,
        })),
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getOrder(orderId: string) {
    try {
      const response = await firstValueFrom(
        this.ordersService.getOrder({ orderId }).pipe(
          timeout(this.TIMEOUT_MS),
          retry({ count: this.MAX_RETRIES, delay: 100 }),
          catchError(err => {
            throw this.mapGrpcError(err);
          }),
        ),
      );

      const order = response.order;
      return {
        orderId: order.orderId,
        createdAt: order.createdAt,
        originZone: GRPC_TO_ZONE[order.originZone],
        destinationZone: GRPC_TO_ZONE[order.destinationZone],
        serviceType: GRPC_TO_SERVICE[order.serviceType],
        packages: order.packages,
        discount: order.discount ? {
          type: GRPC_TO_DISCOUNT[order.discount.type],
          value: order.discount.value,
        } : undefined,
        insuranceEnabled: order.insuranceEnabled,
        status: GRPC_TO_STATUS[order.status],
        breakdown: order.breakdown,
        total: order.total,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async cancelOrder(orderId: string) {
    try {
      const response = await firstValueFrom(
        this.ordersService.cancelOrder({ orderId }).pipe(
          timeout(this.TIMEOUT_MS),
          retry({ count: this.MAX_RETRIES, delay: 100 }),
          catchError(err => {
            throw this.mapGrpcError(err);
          }),
        ),
      );

      return {
        orderId: response.orderId,
        status: GRPC_TO_STATUS[response.status],
        cancelledAt: response.cancelledAt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getReceipt(orderId: string) {
    try {
      // Primero obtener la orden
      const orderResponse = await firstValueFrom(
        this.ordersService.getOrderForReceipt({ orderId }).pipe(
          timeout(this.TIMEOUT_MS),
          retry({ count: this.MAX_RETRIES, delay: 100 }),
          catchError(err => {
            throw this.mapGrpcError(err);
          }),
        ),
      );

      // Luego generar el recibo
      const receiptResponse = await firstValueFrom(
        this.receiptService.generateReceipt({ order: orderResponse.order }).pipe(
          timeout(this.TIMEOUT_MS),
          retry({ count: this.MAX_RETRIES, delay: 100 }),
          catchError(err => {
            throw this.mapGrpcError(err);
          }),
        ),
      );

      return receiptResponse.receipt;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private mapGrpcError(error: any): HttpException {
    const code = error?.code || error?.details?.code;
    const message = error?.message || error?.details?.message || 'Unknown error';

    switch (code) {
      case 3: // INVALID_ARGUMENT
        return new HttpException({ statusCode: 400, message, error: 'Bad Request' }, HttpStatus.BAD_REQUEST);
      case 5: // NOT_FOUND
        return new HttpException({ statusCode: 404, message, error: 'Not Found' }, HttpStatus.NOT_FOUND);
      case 6: // ALREADY_EXISTS
        return new HttpException({ statusCode: 409, message, error: 'Conflict' }, HttpStatus.CONFLICT);
      case 9: // FAILED_PRECONDITION
        return new HttpException({ statusCode: 409, message, error: 'Conflict' }, HttpStatus.CONFLICT);
      case 4: // DEADLINE_EXCEEDED
      case 14: // UNAVAILABLE
        return new HttpException({ statusCode: 503, message: 'Service unavailable', error: 'Service Unavailable' }, HttpStatus.SERVICE_UNAVAILABLE);
      default:
        return new HttpException({ statusCode: 500, message, error: 'Internal Server Error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
