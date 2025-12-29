import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly defaultTtl: number;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.defaultTtl = this.configService.get<number>('REDIS_TTL_SECONDS', 300); // 5 minutes default
  }

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    this.redis = new Redis({
      host,
      port,
      password: password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(`Redis connection retry #${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      this.logger.error('Redis connection error', { error: error.message });
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed');
    });
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, cache miss');
      return null;
    }

    try {
      const data = await this.redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      this.logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, cache set skipped');
      return false;
    }

    try {
      const ttl = ttlSeconds ?? this.defaultTtl;
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      this.logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  getStatus(): string {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  buildRateKey(fromCurrency: string, toCurrency: string): string {
    return `fx:rate:${fromCurrency.toUpperCase()}:${toCurrency.toUpperCase()}`;
  }

  buildRatesKey(baseCurrency: string): string {
    return `fx:rates:${baseCurrency.toUpperCase()}`;
  }
}
