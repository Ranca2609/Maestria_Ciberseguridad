import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';

interface CreateOrderDto {
  originZone: number;
  destinationZone: number;
  serviceType: number;
  packages: Array<{
    weightKg: number;
    heightCm: number;
    widthCm: number;
    lengthCm: number;
    fragile: boolean;
    declaredValueCents: number;
  }>;
  discount?: {
    type: number;
    value: number;
  };
  insuranceEnabled: boolean;
}

@Controller('api')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('orders')
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    try {
      const result = await this.gatewayService.createOrder(createOrderDto);
      return this.transformOrder(result.order);
    } catch (error: any) {
      throw this.handleGrpcError(error);
    }
  }

  @Get('orders')
  async listOrders(
    @Query('pageSize') pageSize?: string,
    @Query('pageToken') pageToken?: string,
  ) {
    try {
      const result = await this.gatewayService.listOrders({
        pageSize: pageSize ? parseInt(pageSize, 10) : 10,
        pageToken: pageToken || '',
      });

      return {
        orders: (result.orders || []).map((order: any) =>
          this.transformOrderSummary(order),
        ),
        nextPageToken: result.nextPageToken || '',
        totalCount: result.totalCount || 0,
      };
    } catch (error: any) {
      throw this.handleGrpcError(error);
    }
  }

  @Get('orders/:orderId')
  async getOrder(@Param('orderId') orderId: string) {
    try {
      const result = await this.gatewayService.getOrder(orderId);
      return this.transformOrder(result.order);
    } catch (error: any) {
      throw this.handleGrpcError(error);
    }
  }

  @Patch('orders/:orderId/cancel')
  async cancelOrder(@Param('orderId') orderId: string) {
    try {
      const result = await this.gatewayService.cancelOrder(orderId);
      return this.transformOrder(result.order);
    } catch (error: any) {
      throw this.handleGrpcError(error);
    }
  }

  @Get('orders/:orderId/receipt')
  async getReceipt(@Param('orderId') orderId: string) {
    try {
      const result = await this.gatewayService.getReceipt(orderId);
      return this.transformReceipt(result.receipt);
    } catch (error: any) {
      throw this.handleGrpcError(error);
    }
  }

  private transformOrder(order: any) {
    if (!order) return null;

    return {
      orderId: order.orderId,
      createdAt: this.timestampToISO(order.createdAt),
      originZone: this.zoneToString(order.originZone),
      destinationZone: this.zoneToString(order.destinationZone),
      serviceType: this.serviceTypeToString(order.serviceType),
      packages: (order.packages || []).map((pkg: any) => ({
        weightKg: pkg.package?.weightKg || 0,
        heightCm: pkg.package?.heightCm || 0,
        widthCm: pkg.package?.widthCm || 0,
        lengthCm: pkg.package?.lengthCm || 0,
        fragile: pkg.package?.fragile || false,
        declaredValueCents: pkg.package?.declaredValueCents || 0,
        volumetricKg: pkg.volumetricKg || 0,
        billableKg: pkg.billableKg || 0,
      })),
      discount: {
        type: this.discountTypeToString(order.discount?.type),
        value: order.discount?.value || 0,
      },
      insuranceEnabled: order.insuranceEnabled || false,
      status: this.statusToString(order.status),
      breakdown: this.transformBreakdown(order.breakdown),
    };
  }

  private transformOrderSummary(order: any) {
    return {
      orderId: order.orderId,
      destinationZone: this.zoneToString(order.destinationZone),
      serviceType: this.serviceTypeToString(order.serviceType),
      status: this.statusToString(order.status),
      totalCents: order.totalCents || 0,
      totalFormatted: `Q ${((order.totalCents || 0) / 100).toFixed(2)}`,
      createdAt: this.timestampToISO(order.createdAt),
    };
  }

  private transformReceipt(receipt: any) {
    if (!receipt) return null;

    return {
      receiptId: receipt.receiptId,
      orderId: receipt.orderId,
      generatedAt: this.timestampToISO(receipt.generatedAt),
      originZone: this.zoneToString(receipt.originZone),
      destinationZone: this.zoneToString(receipt.destinationZone),
      serviceType: this.serviceTypeToString(receipt.serviceType),
      orderStatus: this.statusToString(receipt.orderStatus),
      orderCreatedAt: this.timestampToISO(receipt.orderCreatedAt),
      packages: (receipt.packages || []).map((pkg: any) => ({
        weightKg: pkg.package?.weightKg || 0,
        heightCm: pkg.package?.heightCm || 0,
        widthCm: pkg.package?.widthCm || 0,
        lengthCm: pkg.package?.lengthCm || 0,
        fragile: pkg.package?.fragile || false,
        declaredValueCents: pkg.package?.declaredValueCents || 0,
        volumetricKg: pkg.volumetricKg || 0,
        billableKg: pkg.billableKg || 0,
      })),
      insuranceEnabled: receipt.insuranceEnabled || false,
      discount: {
        type: this.discountTypeToString(receipt.discount?.type),
        value: receipt.discount?.value || 0,
      },
      breakdown: this.transformBreakdown(receipt.breakdown),
      formattedTotal: receipt.formattedTotal,
    };
  }

  private transformBreakdown(breakdown: any) {
    if (!breakdown) return null;

    return {
      orderBillableKg: breakdown.orderBillableKg || 0,
      ratePerKgCents: breakdown.ratePerKgCents || 0,
      ratePerKgFormatted: `Q ${((breakdown.ratePerKgCents || 0) / 100).toFixed(2)}`,
      baseSubtotalCents: breakdown.baseSubtotalCents || 0,
      baseSubtotalFormatted: `Q ${((breakdown.baseSubtotalCents || 0) / 100).toFixed(2)}`,
      serviceMultiplierPercent: breakdown.serviceMultiplierPercent || 100,
      serviceSubtotalCents: breakdown.serviceSubtotalCents || 0,
      serviceSubtotalFormatted: `Q ${((breakdown.serviceSubtotalCents || 0) / 100).toFixed(2)}`,
      fragileSurchargeCents: breakdown.fragileSurchargeCents || 0,
      fragileSurchargeFormatted: `Q ${((breakdown.fragileSurchargeCents || 0) / 100).toFixed(2)}`,
      insuranceSurchargeCents: breakdown.insuranceSurchargeCents || 0,
      insuranceSurchargeFormatted: `Q ${((breakdown.insuranceSurchargeCents || 0) / 100).toFixed(2)}`,
      subtotalWithSurchargesCents: breakdown.subtotalWithSurchargesCents || 0,
      subtotalWithSurchargesFormatted: `Q ${((breakdown.subtotalWithSurchargesCents || 0) / 100).toFixed(2)}`,
      discountAmountCents: breakdown.discountAmountCents || 0,
      discountAmountFormatted: `Q ${((breakdown.discountAmountCents || 0) / 100).toFixed(2)}`,
      totalCents: breakdown.totalCents || 0,
      totalFormatted: `Q ${((breakdown.totalCents || 0) / 100).toFixed(2)}`,
    };
  }

  private timestampToISO(timestamp: any): string {
    if (!timestamp) return new Date().toISOString();
    const seconds = parseInt(timestamp.seconds || '0', 10);
    const nanos = timestamp.nanos || 0;
    return new Date(seconds * 1000 + nanos / 1000000).toISOString();
  }

  private zoneToString(zone: number): string {
    const zones: Record<number, string> = {
      0: 'ZONE_UNSPECIFIED',
      1: 'METRO',
      2: 'INTERIOR',
      3: 'FRONTERA',
    };
    return zones[zone] || 'ZONE_UNSPECIFIED';
  }

  private serviceTypeToString(type: number): string {
    const types: Record<number, string> = {
      0: 'SERVICE_TYPE_UNSPECIFIED',
      1: 'STANDARD',
      2: 'EXPRESS',
      3: 'SAME_DAY',
    };
    return types[type] || 'SERVICE_TYPE_UNSPECIFIED';
  }

  private statusToString(status: number): string {
    const statuses: Record<number, string> = {
      0: 'ORDER_STATUS_UNSPECIFIED',
      1: 'ACTIVE',
      2: 'CANCELLED',
    };
    return statuses[status] || 'ORDER_STATUS_UNSPECIFIED';
  }

  private discountTypeToString(type: number): string {
    const types: Record<number, string> = {
      0: 'DISCOUNT_TYPE_UNSPECIFIED',
      1: 'NONE',
      2: 'PERCENT',
      3: 'FIXED',
    };
    return types[type] || 'NONE';
  }

  private handleGrpcError(error: any): HttpException {
    const code = error.code || 2;
    const message = error.details || error.message || 'Error interno del servidor';

    const grpcToHttpStatus: Record<number, number> = {
      0: HttpStatus.OK,
      1: HttpStatus.INTERNAL_SERVER_ERROR, // CANCELLED
      2: HttpStatus.INTERNAL_SERVER_ERROR, // UNKNOWN
      3: HttpStatus.BAD_REQUEST, // INVALID_ARGUMENT
      4: HttpStatus.GATEWAY_TIMEOUT, // DEADLINE_EXCEEDED
      5: HttpStatus.NOT_FOUND, // NOT_FOUND
      6: HttpStatus.CONFLICT, // ALREADY_EXISTS
      7: HttpStatus.FORBIDDEN, // PERMISSION_DENIED
      8: HttpStatus.TOO_MANY_REQUESTS, // RESOURCE_EXHAUSTED
      9: HttpStatus.BAD_REQUEST, // FAILED_PRECONDITION
      10: HttpStatus.CONFLICT, // ABORTED
      11: HttpStatus.BAD_REQUEST, // OUT_OF_RANGE
      12: HttpStatus.NOT_IMPLEMENTED, // UNIMPLEMENTED
      13: HttpStatus.INTERNAL_SERVER_ERROR, // INTERNAL
      14: HttpStatus.SERVICE_UNAVAILABLE, // UNAVAILABLE
      15: HttpStatus.INTERNAL_SERVER_ERROR, // DATA_LOSS
      16: HttpStatus.UNAUTHORIZED, // UNAUTHENTICATED
    };

    const httpStatus = grpcToHttpStatus[code] || HttpStatus.INTERNAL_SERVER_ERROR;

    return new HttpException(
      {
        statusCode: httpStatus,
        message: message,
        grpcCode: code,
      },
      httpStatus,
    );
  }
}
