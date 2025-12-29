import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../logger/logger.service';
import { ExchangeRateResult, ExchangeRatesResult } from './exchangerate-api.client';

@Injectable()
export class FreeCurrencyApiClient {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private isHealthy = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('FX_FALLBACK_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'FX_FALLBACK_API_URL',
      'https://api.freecurrencyapi.com/v1',
    );

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.configService.get<number>('FX_API_TIMEOUT_MS', 5000),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRateResult> {
    try {
      const response = await this.client.get('/latest', {
        params: {
          apikey: this.apiKey,
          base_currency: fromCurrency,
          currencies: toCurrency,
        },
      });

      if (response.data.data && response.data.data[toCurrency]) {
        this.isHealthy = true;
        return {
          rate: response.data.data[toCurrency],
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error('Invalid response format from FreeCurrencyAPI');
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('FreeCurrencyAPI request failed', {
        error: error.message,
        from: fromCurrency,
        to: toCurrency,
      });
      throw error;
    }
  }

  async getRates(baseCurrency: string): Promise<ExchangeRatesResult> {
    try {
      const response = await this.client.get('/latest', {
        params: {
          apikey: this.apiKey,
          base_currency: baseCurrency,
        },
      });

      if (response.data.data) {
        this.isHealthy = true;
        return {
          rates: response.data.data,
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error('Invalid response format from FreeCurrencyAPI');
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('FreeCurrencyAPI rates request failed', {
        error: error.message,
        base: baseCurrency,
      });
      throw error;
    }
  }

  getProviderName(): string {
    return 'FreeCurrencyAPI';
  }

  getHealthStatus(): string {
    return this.isHealthy ? 'healthy' : 'unhealthy';
  }
}
