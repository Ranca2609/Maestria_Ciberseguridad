import { Injectable } from '@nestjs/common';
import { IIdempotencyStore, ICreateOrderResponse } from '../interfaces/order.interface';
import * as crypto from 'crypto';

interface IdempotencyEntry {
  payloadHash: string;
  response: ICreateOrderResponse;
  createdAt: Date;
}

@Injectable()
export class InMemoryIdempotencyStore implements IIdempotencyStore {
  private store: Map<string, IdempotencyEntry> = new Map();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

  get(key: string): { payloadHash: string; response: ICreateOrderResponse } | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Verificar TTL
    if (Date.now() - entry.createdAt.getTime() > this.TTL_MS) {
      this.store.delete(key);
      return null;
    }

    return {
      payloadHash: entry.payloadHash,
      response: entry.response,
    };
  }

  set(key: string, payloadHash: string, response: ICreateOrderResponse): void {
    this.store.set(key, {
      payloadHash,
      response,
      createdAt: new Date(),
    });
  }

  static hashPayload(payload: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Método para limpiar (útil en tests)
  clear(): void {
    this.store.clear();
  }
}
