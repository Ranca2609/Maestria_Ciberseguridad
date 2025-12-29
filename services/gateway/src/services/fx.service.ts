import { Injectable, Inject, OnModuleInit, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable, timeout, catchError, of } from 'rxjs';

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

// Default fallback rates when FX service is unavailable
const DEFAULT_RATES: Record<string, number> = {
  GTQ: 7.8,
  EUR: 0.92,
  GBP: 0.79,
  MXN: 17.2,
  USD: 1.0,
  CAD: 1.35,
  JPY: 149.5,
};

@Injectable()
export class FxService implements OnModuleInit {
  private readonly logger = new Logger(FxService.name);
  private fxService: FxServiceGrpc;
  private readonly FX_TIMEOUT_MS = 5000; // 5 second timeout for FX service

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

    try {
      const result = await firstValueFrom(
        this.fxService.convert({
          fromCurrency,
          toCurrency,
          amount,
        }).pipe(
          timeout(this.FX_TIMEOUT_MS),
          catchError((error) => {
            this.logger.warn(`FX service unavailable, using fallback rates: ${error.message}`);
            throw error;
          }),
        ),
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
    } catch (error) {
      // Fallback to default rates
      const rate = this.getDefaultRate(fromCurrency, toCurrency);
      const convertedAmount = Math.round(amount * rate * 100) / 100;
      
      this.logger.warn(`Using default rate for ${fromCurrency} → ${toCurrency}: ${rate}`);
      
      return {
        from_currency: fromCurrency.toUpperCase(),
        to_currency: toCurrency.toUpperCase(),
        original_amount: amount,
        converted_amount: convertedAmount,
        rate: rate,
        provider: 'DEFAULT (FX service unavailable)',
        from_cache: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<any> {
    this.logger.log(
      `Getting exchange rate ${fromCurrency} → ${toCurrency}`,
    );

    try {
      const result = await firstValueFrom(
        this.fxService.getExchangeRate({
          fromCurrency,
          toCurrency,
        }).pipe(
          timeout(this.FX_TIMEOUT_MS),
          catchError((error) => {
            this.logger.warn(`FX service unavailable: ${error.message}`);
            throw error;
          }),
        ),
      );

      return {
        from_currency: result.fromCurrency,
        to_currency: result.toCurrency,
        rate: result.rate,
        provider: result.provider,
        from_cache: result.fromCache,
        timestamp: result.timestamp,
      };
    } catch (error) {
      // Fallback to default rates
      const rate = this.getDefaultRate(fromCurrency, toCurrency);
      
      this.logger.warn(`Using default rate for ${fromCurrency} → ${toCurrency}: ${rate}`);
      
      return {
        from_currency: fromCurrency.toUpperCase(),
        to_currency: toCurrency.toUpperCase(),
        rate: rate,
        provider: 'DEFAULT (FX service unavailable)',
        from_cache: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getRates(
    baseCurrency: string,
    targetCurrencies: string[],
  ): Promise<any> {
    this.logger.log(
      `Getting rates for base ${baseCurrency}, targets: ${targetCurrencies.join(', ')}`,
    );

    try {
      const result = await firstValueFrom(
        this.fxService.getRates({
          baseCurrency,
          targetCurrencies,
        }).pipe(
          timeout(this.FX_TIMEOUT_MS),
          catchError((error) => {
            this.logger.warn(`FX service unavailable: ${error.message}`);
            throw error;
          }),
        ),
      );

      return {
        base_currency: result.baseCurrency,
        rates: result.rates,
        provider: result.provider,
        from_cache: result.fromCache,
        timestamp: result.timestamp,
      };
    } catch (error) {
      // Fallback to default rates
      const rates = this.getDefaultRates(baseCurrency, targetCurrencies);
      
      this.logger.warn(`Using default rates for ${baseCurrency}`);
      
      return {
        base_currency: baseCurrency.toUpperCase(),
        rates: rates,
        provider: 'DEFAULT (FX service unavailable)',
        from_cache: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get default exchange rate between two currencies
   */
  private getDefaultRate(from: string, to: string): number {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      return 1.0;
    }

    // Direct conversion from USD
    if (fromUpper === 'USD' && DEFAULT_RATES[toUpper]) {
      return DEFAULT_RATES[toUpper];
    }

    // Direct conversion to USD
    if (toUpper === 'USD' && DEFAULT_RATES[fromUpper]) {
      return 1 / DEFAULT_RATES[fromUpper];
    }

    // Cross rate via USD
    if (DEFAULT_RATES[fromUpper] && DEFAULT_RATES[toUpper]) {
      return DEFAULT_RATES[toUpper] / DEFAULT_RATES[fromUpper];
    }

    // If no rate found, return 1.0 as last resort
    this.logger.warn(`No default rate found for ${from} → ${to}, using 1.0`);
    return 1.0;
  }

  /**
   * Get default rates for multiple currencies
   */
  private getDefaultRates(
    baseCurrency: string,
    targetCurrencies: string[],
  ): Record<string, number> {
    const rates: Record<string, number> = {};
    const base = baseCurrency.toUpperCase();

    for (const target of targetCurrencies) {
      const targetUpper = target.toUpperCase();
      rates[targetUpper] = this.getDefaultRate(base, targetUpper);
    }

    return rates;
  }
}
