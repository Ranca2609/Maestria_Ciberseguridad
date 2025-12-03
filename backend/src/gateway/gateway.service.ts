import { Injectable, OnModuleInit } from '@nestjs/common';
import { join } from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

@Injectable()
export class GatewayService implements OnModuleInit {
  private client: any;

  async onModuleInit() {
    const PROTO_PATH = join(__dirname, '../../proto/quetzalship.proto');

    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: false,
      longs: String,
      enums: Number,
      defaults: true,
      oneofs: true,
    });

    const proto: any = grpc.loadPackageDefinition(packageDefinition);
    const grpcUrl = process.env.GRPC_URL || 'localhost:50051';

    this.client = new proto.quetzalship.QuetzalShipService(
      grpcUrl,
      grpc.credentials.createInsecure(),
    );
  }

  private promisify<T>(method: Function, request: any): Promise<T> {
    return new Promise((resolve, reject) => {
      method.call(this.client, request, (error: any, response: T) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async createOrder(data: any): Promise<any> {
    return this.promisify(this.client.createOrder, data);
  }

  async listOrders(data: any): Promise<any> {
    return this.promisify(this.client.listOrders, data);
  }

  async getOrder(orderId: string): Promise<any> {
    return this.promisify(this.client.getOrder, { orderId });
  }

  async cancelOrder(orderId: string): Promise<any> {
    return this.promisify(this.client.cancelOrder, { orderId });
  }

  async getReceipt(orderId: string): Promise<any> {
    return this.promisify(this.client.getReceipt, { orderId });
  }
}
