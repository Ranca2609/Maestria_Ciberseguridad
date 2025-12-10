import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { OrderService } from '../services';
import {
  ICreateOrderRequest,
  IListOrdersRequest,
  IGetOrderRequest,
  ICancelOrderRequest,
  IGetOrderForReceiptRequest,
} from '../interfaces/order.interface';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrdersService', 'CreateOrder')
  async createOrder(request: ICreateOrderRequest) {
    try {
      return await this.orderService.createOrder(request);
    } catch (error: any) {
      throw new RpcException({
        code: error.code || 13,
        message: error.message || 'Internal error',
      });
    }
  }

  @GrpcMethod('OrdersService', 'ListOrders')
  listOrders(request: IListOrdersRequest) {
    try {
      return this.orderService.listOrders(request);
    } catch (error: any) {
      throw new RpcException({
        code: error.code || 13,
        message: error.message || 'Internal error',
      });
    }
  }

  @GrpcMethod('OrdersService', 'GetOrder')
  getOrder(request: IGetOrderRequest) {
    try {
      return this.orderService.getOrder(request);
    } catch (error: any) {
      throw new RpcException({
        code: error.code || 13,
        message: error.message || 'Internal error',
      });
    }
  }

  @GrpcMethod('OrdersService', 'CancelOrder')
  cancelOrder(request: ICancelOrderRequest) {
    try {
      return this.orderService.cancelOrder(request);
    } catch (error: any) {
      throw new RpcException({
        code: error.code || 13,
        message: error.message || 'Internal error',
      });
    }
  }

  @GrpcMethod('OrdersService', 'GetOrderForReceipt')
  getOrderForReceipt(request: IGetOrderForReceiptRequest) {
    try {
      return this.orderService.getOrderForReceipt(request);
    } catch (error: any) {
      throw new RpcException({
        code: error.code || 13,
        message: error.message || 'Internal error',
      });
    }
  }
}
