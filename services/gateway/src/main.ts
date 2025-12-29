import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { GatewayModule } from "./gateway.module";

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('QuetzalShip Gateway API')
    .setDescription('API Gateway para el sistema de envíos QuetzalShip')
    .setVersion('2.0.0')
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'Local development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Gateway is running on http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api`);
}

bootstrap();
