import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController } from './controllers';
import { OrderService } from './services';
import { InMemoryOrderRepository, InMemoryIdempotencyStore, MssqlOrderRepository } from './repositories';
import { DatabaseModule } from './database';
import { ORDER_REPOSITORY } from './constants';

@Module({
  imports: [
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'PRICING_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'pricing',
          protoPath: join(__dirname, '../proto/pricing.proto'),
          url: process.env.PRICING_SERVICE_URL || 'localhost:50052',
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    InMemoryIdempotencyStore,
    InMemoryOrderRepository,
    MssqlOrderRepository,
    {
      provide: ORDER_REPOSITORY,
      useFactory: (
        mssqlRepository: MssqlOrderRepository,
        inMemoryRepository: InMemoryOrderRepository,
      ) => {
        // Use MSSQL if DATABASE_URL is set
        // Connection is established in DatabaseService.onModuleInit() before queries run
        if (process.env.DATABASE_URL) {
          console.log('Using MSSQL repository for orders');
          return mssqlRepository;
        }
        console.log('Using in-memory repository for orders (no DATABASE_URL)');
        return inMemoryRepository;
      },
      inject: [MssqlOrderRepository, InMemoryOrderRepository],
    },
  ],
  exports: [OrderService],
})
export class OrdersModule {}
