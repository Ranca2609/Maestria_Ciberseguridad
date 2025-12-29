/**
 * Structured Logger for QuetzalShip Microservices
 * Outputs JSON format compatible with ELK stack
 */

export class StructuredLogger {
  constructor(private readonly serviceName: string) {}

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>) {
    this.log('error', message, {
      ...metadata,
      error: error?.message,
      stack: error?.stack,
      errorName: error?.name,
    });
  }

  debug(message: string, metadata?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, metadata);
    }
  }

  private log(level: string, message: string, metadata?: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...metadata,
    };

    console.log(JSON.stringify(logEntry));
  }
}

// Export singleton instances for each service
export const createLogger = (serviceName: string) => new StructuredLogger(serviceName);
