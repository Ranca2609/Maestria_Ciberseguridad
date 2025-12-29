import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FxService } from '../services/fx.service';
import { LoggerService } from '../logger/logger.service';
import { Metadata } from '@grpc/grpc-js';
import { status } from '@grpc/grpc-js';

interface GetExchangeRateRequest {
  from_currency: string;
  to_currency: string;
}

interface ConvertRequest {
  from_currency: string;
  to_currency: string;
  amount: number;
}

interface GetRatesRequest {
  base_currency: string;
  target_currencies: string[];
}

@Controller()
export class FxController {
  constructor(
    private readonly fxService: FxService,
    private readonly logger: LoggerService,
  ) {}

  @GrpcMethod('FxService', 'GetExchangeRate')
  async getExchangeRate(data: GetExchangeRateRequest, metadata: Metadata) {
    const correlationId = this.extractCorrelationId(metadata);
    this.logger.log('GetExchangeRate request', {
      correlationId,
      from: data.from_currency,
      to: data.to_currency,
    });

    try {
      const result = await this.fxService.getExchangeRate(
        data.from_currency,
        data.to_currency,
      );
      
      this.logger.log('GetExchangeRate success', {
        correlationId,
        rate: result.rate,
        provider: result.provider,
        fromCache: result.from_cache,
      });
      
      return result;
    } catch (error) {
      this.logger.error('GetExchangeRate failed', {
        correlationId,
        error: error.message,
      });
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('FxService', 'Convert')
  async convert(data: ConvertRequest, metadata: Metadata) {
    const correlationId = this.extractCorrelationId(metadata);
    this.logger.log('Convert request', {
      correlationId,
      from: data.from_currency,
      to: data.to_currency,
      amount: data.amount,
    });

    try {
      const result = await this.fxService.convert(
        data.from_currency,
        data.to_currency,
        data.amount,
      );
      
      this.logger.log('Convert success', {
        correlationId,
        convertedAmount: result.converted_amount,
      });
      
      return result;
    } catch (error) {
      this.logger.error('Convert failed', {
        correlationId,
        error: error.message,
      });
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('FxService', 'GetRates')
  async getRates(data: GetRatesRequest, metadata: Metadata) {
    const correlationId = this.extractCorrelationId(metadata);
    this.logger.log('GetRates request', {
      correlationId,
      base: data.base_currency,
      targets: data.target_currencies,
    });

    try {
      const result = await this.fxService.getRates(
        data.base_currency,
        data.target_currencies,
      );
      
      this.logger.log('GetRates success', {
        correlationId,
        ratesCount: Object.keys(result.rates).length,
      });
      
      return result;
    } catch (error) {
      this.logger.error('GetRates failed', {
        correlationId,
        error: error.message,
      });
      throw new RpcException({
        code: status.INTERNAL,
        message: error.message,
      });
    }
  }

  @GrpcMethod('FxService', 'HealthCheck')
  async healthCheck() {
    return this.fxService.healthCheck();
  }

  private extractCorrelationId(metadata: Metadata): string {
    const values = metadata.get('x-correlation-id');
    return values.length > 0 ? String(values[0]) : 'unknown';
  }
}
