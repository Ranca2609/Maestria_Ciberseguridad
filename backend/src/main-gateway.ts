import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [GatewayModule],
})
class GatewayAppModule {}

async function bootstrap() {
  const app = await NestFactory.create(GatewayAppModule);

  // Habilitar CORS para el frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://frontend:80'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.GATEWAY_PORT || 3001;
  await app.listen(port);
  console.log(`Gateway REST API running on port ${port}`);
}

bootstrap();
