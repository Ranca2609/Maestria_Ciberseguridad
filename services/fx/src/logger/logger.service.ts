import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LogContext {
  [key: string]: any;
}

@Injectable()
export class LoggerService {
  private readonly serviceName: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = 'fx-service';
  }

  private formatLog(level: string, message: string, context?: LogContext): string {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  log(message: string, context?: LogContext): void {
    console.log(this.formatLog('INFO', message, context));
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatLog('ERROR', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('WARN', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.configService.get('NODE_ENV') !== 'production') {
      console.debug(this.formatLog('DEBUG', message, context));
    }
  }
}
