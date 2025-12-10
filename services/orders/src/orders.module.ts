import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController } from './controllers';
import { OrderService } from './services';
import { InMemoryOrderRepository, InMemoryIdempotencyStore } from './repositories';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PRICING_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'pricing',
          protoPath: join(__dirname, '../../contracts/proto/pricing.proto'),
          url: process.env.PRICING_SERVICE_URL || 'localhost:50052',
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    InMemoryOrderRepository,
    InMemoryIdempotencyStore,
  ],
  exports: [OrderService],
})
export class OrdersModule {}
