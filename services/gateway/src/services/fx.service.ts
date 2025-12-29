import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface ConvertResponse {
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  provider: string;
  fromCache: boolean;
  timestamp: string;
}

interface ExchangeRateResponse {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  provider: string;
  fromCache: boolean;
  timestamp: string;
}

interface GetRatesResponse {
  baseCurrency: string;
  rates: Record<string, number>;
  provider: string;
  fromCache: boolean;
  timestamp: string;
}

interface FxServiceGrpc {
  convert(data: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
  }): Observable<ConvertResponse>;
  getExchangeRate(data: {
    fromCurrency: string;
    toCurrency: string;
  }): Observable<ExchangeRateResponse>;
  getRates(data: {
    baseCurrency: string;
    targetCurrencies: string[];
  }): Observable<GetRatesResponse>;
}

@Injectable()
export class FxService implements OnModuleInit {
  private readonly logger = new Logger(FxService.name);
  private fxService: FxServiceGrpc;

  constructor(@Inject('FX_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.fxService = this.client.getService<FxServiceGrpc>('FxService');
    this.logger.log('FX gRPC service initialized');
  }

  async convert(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
  ): Promise<any> {
    this.logger.log(
      `Converting ${amount} ${fromCurrency} → ${toCurrency}`,
    );

    const result = await firstValueFrom(
      this.fxService.convert({
        fromCurrency,
        toCurrency,
        amount,
      }),
    );

    return {
      from_currency: result.fromCurrency,
      to_currency: result.toCurrency,
      original_amount: result.originalAmount,
      converted_amount: result.convertedAmount,
      rate: result.rate,
      provider: result.provider,
      from_cache: result.fromCache,
      timestamp: result.timestamp,
    };
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<any> {
    this.logger.log(
      `Getting exchange rate ${fromCurrency} → ${toCurrency}`,
    );

    const result = await firstValueFrom(
      this.fxService.getExchangeRate({
        fromCurrency,
        toCurrency,
      }),
    );

    return {
      from_currency: result.fromCurrency,
      to_currency: result.toCurrency,
      rate: result.rate,
      provider: result.provider,
      from_cache: result.fromCache,
      timestamp: result.timestamp,
    };
  }

  async getRates(
    baseCurrency: string,
    targetCurrencies: string[],
  ): Promise<any> {
    this.logger.log(
      `Getting rates for base ${baseCurrency}, targets: ${targetCurrencies.join(', ')}`,
    );

    const result = await firstValueFrom(
      this.fxService.getRates({
        baseCurrency,
        targetCurrencies,
      }),
    );

    return {
      base_currency: result.baseCurrency,
      rates: result.rates,
      provider: result.provider,
      from_cache: result.fromCache,
      timestamp: result.timestamp,
    };
  }
}
