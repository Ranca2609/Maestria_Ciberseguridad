import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PricingModule } from './pricing.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PricingModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'pricing',
        protoPath: join(__dirname, '../proto/pricing.proto'),
        url: `0.0.0.0:${process.env.GRPC_PORT || 50052}`,
      },
    },
  );

  await app.listen();
  console.log(`Pricing Service is running on port ${process.env.GRPC_PORT || 50052}`);
}

bootstrap();
