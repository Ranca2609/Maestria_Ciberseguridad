import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ReceiptModule } from './receipt.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ReceiptModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'receipt',
        protoPath: join(__dirname, '../../contracts/proto/receipt.proto'),
        url: `0.0.0.0:${process.env.GRPC_PORT || 50054}`,
      },
    },
  );

  await app.listen();
  console.log(`Receipt Service is running on port ${process.env.GRPC_PORT || 50054}`);
}

bootstrap();
