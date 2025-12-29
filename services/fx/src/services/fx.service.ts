import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { ExchangeRateApiClient } from '../clients/exchangerate-api.client';
import { FreeCurrencyApiClient } from '../clients/freecurrency-api.client';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { LoggerService } from '../logger/logger.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CircuitBreaker = require('opossum');

interface RateCacheData {
  rate: number;
  timestamp: string;
  provider: string;
}

interface RatesCacheData {
  rates: Record<string, number>;
  timestamp: string;
  provider: string;
}

// Default fallback rates for graceful degradation
const DEFAULT_RATES: Record<string, number> = {
  GTQ: 7.8,
  EUR: 0.92,
  GBP: 0.79,
  MXN: 17.2,
  USD: 1.0,
};

@Injectable()
export class FxService implements OnModuleInit {
  private primaryBreaker: any;
  private fallbackBreaker: any;
  private readonly maxRetries: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly primaryClient: ExchangeRateApiClient,
    private readonly fallbackClient: FreeCurrencyApiClient,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly logger: LoggerService,
  ) {
    this.maxRetries = this.configService.get<number>('FX_MAX_RETRIES', 2);
  }

  onModuleInit() {
    // Create circuit breakers for each provider
    this.primaryBreaker = this.circuitBreakerService.createBreaker(
      async (from: string, to: string) => this.primaryClient.getExchangeRate(from, to),
      'primary-fx-api',
    );

    this.fallbackBreaker = this.circuitBreakerService.createBreaker(
      async (from: string, to: string) => this.fallbackClient.getExchangeRate(from, to),
      'fallback-fx-api',
    );

    this.logger.log('FX Service initialized with circuit breakers');
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<{
    from_currency: string;
    to_currency: string;
    rate: number;
    provider: string;
    from_cache: boolean;
    timestamp: string;
  }> {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();
    const cacheKey = this.cacheService.buildRateKey(from, to);

    // 1. Try cache first
    const cached = await this.cacheService.get<RateCacheData>(cacheKey);
    if (cached) {
      this.logger.log('Cache hit for exchange rate', { from, to });
      return {
        from_currency: from,
        to_currency: to,
        rate: cached.rate,
        provider: `${cached.provider} (cached)`,
        from_cache: true,
        timestamp: cached.timestamp,
      };
    }

    // 2. Try primary provider with circuit breaker
    try {
      const result = await this.circuitBreakerService.executeWithRetry(
        () => this.primaryBreaker.fire(from, to),
        this.maxRetries,
      ) as { rate: number; timestamp: string };

      const cacheData: RateCacheData = {
        rate: result.rate,
        timestamp: result.timestamp,
        provider: this.primaryClient.getProviderName(),
      };
      await this.cacheService.set(cacheKey, cacheData);

      return {
        from_currency: from,
        to_currency: to,
        rate: result.rate,
        provider: this.primaryClient.getProviderName(),
        from_cache: false,
        timestamp: result.timestamp,
      };
    } catch (primaryError) {
      this.logger.warn('Primary provider failed, trying fallback', {
        error: (primaryError as Error).message,
      });
    }

    // 3. Try fallback provider
    try {
      const result = await this.circuitBreakerService.executeWithRetry(
        () => this.fallbackBreaker.fire(from, to),
        this.maxRetries,
      ) as { rate: number; timestamp: string };

      const cacheData: RateCacheData = {
        rate: result.rate,
        timestamp: result.timestamp,
        provider: this.fallbackClient.getProviderName(),
      };
      await this.cacheService.set(cacheKey, cacheData);

      return {
        from_currency: from,
        to_currency: to,
        rate: result.rate,
        provider: this.fallbackClient.getProviderName(),
        from_cache: false,
        timestamp: result.timestamp,
      };
    } catch (fallbackError) {
      this.logger.warn('Fallback provider failed, using degraded mode', {
        error: (fallbackError as Error).message,
      });
    }

    // 4. Graceful degradation - use default rates
    const defaultRate = this.getDefaultRate(from, to);
    if (defaultRate !== null) {
      this.logger.warn('Using default rate (degraded mode)', { from, to, rate: defaultRate });
      return {
        from_currency: from,
        to_currency: to,
        rate: defaultRate,
        provider: 'DEFAULT (degraded)',
        from_cache: false,
        timestamp: new Date().toISOString(),
      };
    }

    throw new Error(`Unable to get exchange rate for ${from} → ${to}`);
  }

  async convert(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
  ): Promise<{
    from_currency: string;
    to_currency: string;
    original_amount: number;
    converted_amount: number;
    rate: number;
    provider: string;
    from_cache: boolean;
    timestamp: string;
  }> {
    const rateResult = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Math.round(amount * rateResult.rate * 100) / 100;

    return {
      from_currency: rateResult.from_currency,
      to_currency: rateResult.to_currency,
      original_amount: amount,
      converted_amount: convertedAmount,
      rate: rateResult.rate,
      provider: rateResult.provider,
      from_cache: rateResult.from_cache,
      timestamp: rateResult.timestamp,
    };
  }

  async getRates(
    baseCurrency: string,
    targetCurrencies: string[],
  ): Promise<{
    base_currency: string;
    rates: Record<string, number>;
    provider: string;
    from_cache: boolean;
    timestamp: string;
  }> {
    const base = baseCurrency.toUpperCase();
    const cacheKey = this.cacheService.buildRatesKey(base);

    // Try cache first
    const cached = await this.cacheService.get<RatesCacheData>(cacheKey);
    if (cached) {
      const filteredRates = this.filterRates(cached.rates, targetCurrencies);
      return {
        base_currency: base,
        rates: filteredRates,
        provider: `${cached.provider} (cached)`,
        from_cache: true,
        timestamp: cached.timestamp,
      };
    }

    // Try primary provider
    try {
      const result = await this.primaryClient.getRates(base);
      const cacheData: RatesCacheData = {
        rates: result.rates,
        timestamp: result.timestamp,
        provider: this.primaryClient.getProviderName(),
      };
      await this.cacheService.set(cacheKey, cacheData);

      return {
        base_currency: base,
        rates: this.filterRates(result.rates, targetCurrencies),
        provider: this.primaryClient.getProviderName(),
        from_cache: false,
        timestamp: result.timestamp,
      };
    } catch (primaryError) {
      this.logger.warn('Primary provider failed for getRates', {
        error: (primaryError as Error).message,
      });
    }

    // Try fallback
    try {
      const result = await this.fallbackClient.getRates(base);
      const cacheData: RatesCacheData = {
        rates: result.rates,
        timestamp: result.timestamp,
        provider: this.fallbackClient.getProviderName(),
      };
      await this.cacheService.set(cacheKey, cacheData);

      return {
        base_currency: base,
        rates: this.filterRates(result.rates, targetCurrencies),
        provider: this.fallbackClient.getProviderName(),
        from_cache: false,
        timestamp: result.timestamp,
      };
    } catch (fallbackError) {
      this.logger.warn('Fallback provider failed for getRates', {
        error: (fallbackError as Error).message,
      });
    }

    // Degraded mode
    return {
      base_currency: base,
      rates: this.filterRates(DEFAULT_RATES, targetCurrencies),
      provider: 'DEFAULT (degraded)',
      from_cache: false,
      timestamp: new Date().toISOString(),
    };
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    primary_provider_status: string;
    fallback_provider_status: string;
    cache_status: string;
  }> {
    const primaryStatus = this.primaryClient.getHealthStatus();
    const fallbackStatus = this.fallbackClient.getHealthStatus();
    const cacheStatus = this.cacheService.getStatus();

    const isHealthy = 
      (primaryStatus === 'healthy' || fallbackStatus === 'healthy') &&
      cacheStatus === 'connected';

    return {
      healthy: isHealthy,
      primary_provider_status: primaryStatus,
      fallback_provider_status: fallbackStatus,
      cache_status: cacheStatus,
    };
  }

  private getDefaultRate(from: string, to: string): number | null {
    if (from === 'USD' && DEFAULT_RATES[to]) {
      return DEFAULT_RATES[to];
    }
    if (to === 'USD' && DEFAULT_RATES[from]) {
      return 1 / DEFAULT_RATES[from];
    }
    // Cross rate via USD
    if (DEFAULT_RATES[from] && DEFAULT_RATES[to]) {
      return DEFAULT_RATES[to] / DEFAULT_RATES[from];
    }
    return null;
  }

  private filterRates(
    rates: Record<string, number>,
    targetCurrencies: string[],
  ): Record<string, number> {
    if (!targetCurrencies || targetCurrencies.length === 0) {
      return rates;
    }
    const filtered: Record<string, number> = {};
    for (const currency of targetCurrencies) {
      const upper = currency.toUpperCase();
      if (rates[upper] !== undefined) {
        filtered[upper] = rates[upper];
      }
    }
    return filtered;
  }
}
