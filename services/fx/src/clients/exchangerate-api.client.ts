import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../logger/logger.service';

export interface ExchangeRateResult {
  rate: number;
  timestamp: string;
}

export interface ExchangeRatesResult {
  rates: Record<string, number>;
  timestamp: string;
}

@Injectable()
export class ExchangeRateApiClient {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private isHealthy = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('FX_PRIMARY_API_KEY', '');
    this.baseUrl = this.configService.get<string>(
      'FX_PRIMARY_API_URL',
      'https://v6.exchangerate-api.com/v6',
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
      const response = await this.client.get(
        `/${this.apiKey}/pair/${fromCurrency}/${toCurrency}`,
      );

      if (response.data.result === 'success') {
        this.isHealthy = true;
        return {
          rate: response.data.conversion_rate,
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error(`API error: ${response.data['error-type']}`);
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('ExchangeRate-API request failed', {
        error: error.message,
        from: fromCurrency,
        to: toCurrency,
      });
      throw error;
    }
  }

  async getRates(baseCurrency: string): Promise<ExchangeRatesResult> {
    try {
      const response = await this.client.get(
        `/${this.apiKey}/latest/${baseCurrency}`,
      );

      if (response.data.result === 'success') {
        this.isHealthy = true;
        return {
          rates: response.data.conversion_rates,
          timestamp: new Date().toISOString(),
        };
      }

      throw new Error(`API error: ${response.data['error-type']}`);
    } catch (error) {
      this.isHealthy = false;
      this.logger.error('ExchangeRate-API rates request failed', {
        error: error.message,
        base: baseCurrency,
      });
      throw error;
    }
  }

  getProviderName(): string {
    return 'ExchangeRate-API';
  }

  getHealthStatus(): string {
    return this.isHealthy ? 'healthy' : 'unhealthy';
  }
}
