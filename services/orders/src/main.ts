import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrdersModule } from './orders.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'orders',
        protoPath: join(__dirname, '../../contracts/proto/orders.proto'),
        url: `0.0.0.0:${process.env.GRPC_PORT || 50051}`,
      },
    },
  );

  await app.listen();
  console.log(`Orders Service is running on port ${process.env.GRPC_PORT || 50051}`);
}

bootstrap();
