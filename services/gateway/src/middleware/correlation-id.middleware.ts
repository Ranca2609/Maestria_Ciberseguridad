import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
    
    // Attach to request for downstream use
    (req as any).correlationId = correlationId;
    
    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  }
}
