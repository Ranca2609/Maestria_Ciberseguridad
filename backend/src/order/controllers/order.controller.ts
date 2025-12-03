import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrderService } from '../services/order.service';
import { IPackage, IDiscount } from '../../shared/interfaces';
import { Zone, ServiceType, DiscountType } from '../../shared/enums';

// Interfaces para los mensajes gRPC
interface GrpcPackage {
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  fragile: boolean;
  declaredValueCents: number;
}

interface GrpcDiscount {
  type: number;
  value: number;
}

interface CreateOrderRequest {
  originZone: number;
  destinationZone: number;
  serviceType: number;
  packages: GrpcPackage[];
  discount?: GrpcDiscount;
  insuranceEnabled: boolean;
}

interface ListOrdersRequest {
  pageSize?: number;
  pageToken?: string;
}

interface GetOrderRequest {
  orderId: string;
}

interface CancelOrderRequest {
  orderId: string;
}

interface GetReceiptRequest {
  orderId: string;
}

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('QuetzalShipService', 'CreateOrder')
  async createOrder(request: CreateOrderRequest) {
    const packages: IPackage[] = (request.packages || []).map((pkg) => ({
      weightKg: pkg.weightKg || 0,
      heightCm: pkg.heightCm || 0,
      widthCm: pkg.widthCm || 0,
      lengthCm: pkg.lengthCm || 0,
      fragile: pkg.fragile || false,
      declaredValueCents: pkg.declaredValueCents || 0,
    }));

    const discount: IDiscount = request.discount
      ? {
          type: request.discount.type as DiscountType,
          value: request.discount.value || 0,
        }
      : {
          type: DiscountType.NONE,
          value: 0,
        };

    const order = await this.orderService.createOrder(
      request.originZone as Zone,
      request.destinationZone as Zone,
      request.serviceType as ServiceType,
      packages,
      discount,
      request.insuranceEnabled || false,
    );

    return {
      order: this.mapOrderToGrpc(order),
    };
  }

  @GrpcMethod('QuetzalShipService', 'ListOrders')
  async listOrders(request: ListOrdersRequest) {
    const result = await this.orderService.listOrders(
      request.pageSize,
      request.pageToken,
    );

    return {
      orders: result.orders.map((summary) => ({
        orderId: summary.orderId,
        destinationZone: summary.destinationZone,
        serviceType: summary.serviceType,
        status: summary.status,
        totalCents: summary.totalCents,
        createdAt: this.dateToTimestamp(summary.createdAt),
      })),
      nextPageToken: result.nextPageToken,
      totalCount: result.totalCount,
    };
  }

  @GrpcMethod('QuetzalShipService', 'GetOrder')
  async getOrder(request: GetOrderRequest) {
    const order = await this.orderService.getOrder(request.orderId);
    return {
      order: this.mapOrderToGrpc(order),
    };
  }

  @GrpcMethod('QuetzalShipService', 'CancelOrder')
  async cancelOrder(request: CancelOrderRequest) {
    const order = await this.orderService.cancelOrder(request.orderId);
    return {
      order: this.mapOrderToGrpc(order),
    };
  }

  @GrpcMethod('QuetzalShipService', 'GetReceipt')
  async getReceipt(request: GetReceiptRequest) {
    const receipt = await this.orderService.getReceipt(request.orderId);

    return {
      receipt: {
        receiptId: receipt.receiptId,
        orderId: receipt.orderId,
        generatedAt: this.dateToTimestamp(receipt.generatedAt),
        originZone: receipt.originZone,
        destinationZone: receipt.destinationZone,
        serviceType: receipt.serviceType,
        orderStatus: receipt.orderStatus,
        orderCreatedAt: this.dateToTimestamp(receipt.orderCreatedAt),
        packages: receipt.packages.map((pkg) => ({
          package: {
            weightKg: pkg.weightKg,
            heightCm: pkg.heightCm,
            widthCm: pkg.widthCm,
            lengthCm: pkg.lengthCm,
            fragile: pkg.fragile,
            declaredValueCents: pkg.declaredValueCents,
          },
          volumetricKg: pkg.volumetricKg,
          billableKg: pkg.billableKg,
        })),
        insuranceEnabled: receipt.insuranceEnabled,
        discount: {
          type: receipt.discount.type,
          value: receipt.discount.value,
        },
        breakdown: this.mapBreakdownToGrpc(receipt.breakdown),
        formattedTotal: receipt.formattedTotal,
      },
    };
  }

  private mapOrderToGrpc(order: any) {
    return {
      orderId: order.orderId,
      createdAt: this.dateToTimestamp(order.createdAt),
      originZone: order.originZone,
      destinationZone: order.destinationZone,
      serviceType: order.serviceType,
      packages: order.packages.map((pkg: any) => ({
        package: {
          weightKg: pkg.weightKg,
          heightCm: pkg.heightCm,
          widthCm: pkg.widthCm,
          lengthCm: pkg.lengthCm,
          fragile: pkg.fragile,
          declaredValueCents: pkg.declaredValueCents,
        },
        volumetricKg: pkg.volumetricKg,
        billableKg: pkg.billableKg,
      })),
      discount: {
        type: order.discount.type,
        value: order.discount.value,
      },
      insuranceEnabled: order.insuranceEnabled,
      status: order.status,
      breakdown: this.mapBreakdownToGrpc(order.breakdown),
    };
  }

  private mapBreakdownToGrpc(breakdown: any) {
    return {
      orderBillableKg: breakdown.orderBillableKg,
      ratePerKgCents: breakdown.ratePerKgCents,
      baseSubtotalCents: breakdown.baseSubtotalCents,
      serviceMultiplierPercent: breakdown.serviceMultiplierPercent,
      serviceSubtotalCents: breakdown.serviceSubtotalCents,
      fragileSurchargeCents: breakdown.fragileSurchargeCents,
      insuranceSurchargeCents: breakdown.insuranceSurchargeCents,
      subtotalWithSurchargesCents: breakdown.subtotalWithSurchargesCents,
      discountAmountCents: breakdown.discountAmountCents,
      totalCents: breakdown.totalCents,
    };
  }

  private dateToTimestamp(date: Date) {
    const time = date.getTime();
    return {
      seconds: Math.floor(time / 1000),
      nanos: (time % 1000) * 1000000,
    };
  }
}
