import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FxController } from './grpc/fx.controller';
import { FxService } from './services/fx.service';
import { CacheService } from './cache/cache.service';
import { ExchangeRateApiClient } from './clients/exchangerate-api.client';
import { FreeCurrencyApiClient } from './clients/freecurrency-api.client';
import { CircuitBreakerService } from './resilience/circuit-breaker.service';
import { LoggerService } from './logger/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [FxController],
  providers: [
    FxService,
    CacheService,
    ExchangeRateApiClient,
    FreeCurrencyApiClient,
    CircuitBreakerService,
    LoggerService,
  ],
})
export class AppModule {}
