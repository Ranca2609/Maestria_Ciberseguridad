import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController, HealthController, FxController } from './controllers';
import { GatewayService, FxService } from './services';
import { CorrelationIdMiddleware, LoggerMiddleware } from './middleware';

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
      {
        name: 'FX_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'fx',
          protoPath: join(__dirname, '../proto/fx.proto'),
          url: process.env.FX_SERVICE_URL || 'localhost:50055',
        },
      },
    ]),
  ],
  controllers: [OrderController, HealthController, FxController],
  providers: [GatewayService, FxService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, LoggerMiddleware)
      .forRoutes('*');
  }
}
