import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const correlationId = (req as any).correlationId || 'unknown';
    const startTime = Date.now();

    // Log request
    this.logStructured('info', 'Incoming request', {
      method,
      url: originalUrl,
      ip,
      userAgent,
      correlationId,
    });

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';

      this.logStructured(level, 'Request completed', {
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        correlationId,
      });
    });

    next();
  }

  private logStructured(level: string, message: string, metadata: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'gateway',
      message,
      correlationId: metadata.correlationId,
      ...metadata,
    };

    // Output as JSON for GELF/Logstash
    console.log(JSON.stringify(logEntry));
  }
}
