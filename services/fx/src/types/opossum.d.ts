declare module 'opossum' {
  interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
    name?: string;
  }

  class CircuitBreaker<TArgs extends unknown[], TResult> {
    constructor(
      action: (...args: TArgs) => Promise<TResult>,
      options?: CircuitBreakerOptions
    );

    fire(...args: TArgs): Promise<TResult>;
    fallback(func: (...args: TArgs) => TResult | Promise<TResult>): void;
    on(event: string, callback: (...args: any[]) => void): void;
    
    readonly opened: boolean;
    readonly closed: boolean;
    readonly halfOpen: boolean;
    readonly status: {
      stats: {
        failures: number;
        successes: number;
        rejects: number;
        fires: number;
        timeouts: number;
        cacheHits: number;
        cacheMisses: number;
      };
    };
  }

  export = CircuitBreaker;
}
