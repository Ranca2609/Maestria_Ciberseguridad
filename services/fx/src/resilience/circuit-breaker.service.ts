import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const CircuitBreaker = require('opossum');

export interface CircuitBreakerOptions {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  volumeThreshold: number;
}

@Injectable()
export class CircuitBreakerService implements OnModuleInit {
  private readonly options: CircuitBreakerOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.options = {
      timeout: this.configService.get<number>('CB_TIMEOUT_MS', 3000),
      errorThresholdPercentage: this.configService.get<number>('CB_ERROR_THRESHOLD', 50),
      resetTimeout: this.configService.get<number>('CB_RESET_TIMEOUT_MS', 30000),
      volumeThreshold: this.configService.get<number>('CB_VOLUME_THRESHOLD', 5),
    };
  }

  onModuleInit() {
    this.logger.log('Circuit Breaker initialized', {
      timeout: this.options.timeout,
      errorThreshold: this.options.errorThresholdPercentage,
      resetTimeout: this.options.resetTimeout,
    });
  }

  createBreaker<T>(
    action: (...args: any[]) => Promise<T>,
    name: string,
  ): any {
    const breaker = new CircuitBreaker(action, {
      timeout: this.options.timeout,
      errorThresholdPercentage: this.options.errorThresholdPercentage,
      resetTimeout: this.options.resetTimeout,
      volumeThreshold: this.options.volumeThreshold,
      name,
    });

    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker OPEN: ${name}`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker HALF-OPEN: ${name}`);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker CLOSED: ${name}`);
    });

    breaker.on('fallback', () => {
      this.logger.log(`Circuit breaker FALLBACK triggered: ${name}`);
    });

    breaker.on('timeout', () => {
      this.logger.warn(`Circuit breaker TIMEOUT: ${name}`);
    });

    breaker.on('reject', () => {
      this.logger.warn(`Circuit breaker REJECTED: ${name}`);
    });

    return breaker;
  }

  async executeWithRetry<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn(`Retry attempt ${attempt}/${maxRetries}, waiting ${delay}ms`, {
            error: lastError.message,
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
