import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController, HealthController } from './controllers';
import { GatewayService } from './services';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'ORDERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'orders',
          protoPath: join(__dirname, '../proto/orders.proto'),
          url: process.env.ORDERS_SERVICE_URL || 'localhost:50051',
        },
      },
      {
        name: 'RECEIPT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'receipt',
          protoPath: join(__dirname, '../proto/receipt.proto'),
          url: process.env.RECEIPT_SERVICE_URL || 'localhost:50054',
        },
      },
    ]),
  ],
  controllers: [OrderController, HealthController],
  providers: [GatewayService],
})
export class GatewayModule {}
