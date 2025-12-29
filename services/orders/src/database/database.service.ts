import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: sql.ConnectionPool | null = null;

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private parseDatabaseUrl(url: string): sql.config {
    // Parse: mssql://user:password@host:port/database
    const regex = /^mssql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = url.match(regex);

    if (!match) {
      throw new Error(`Invalid DATABASE_URL format: ${url}`);
    }

    const [, user, password, server, port, database] = match;

    return {
      user,
      password,
      server,
      port: parseInt(port, 10),
      database,
      options: {
        encrypt: false, // For local development
        trustServerCertificate: true, // For self-signed certs
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }

  async connect(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not set, database features disabled');
      return;
    }

    try {
      const config = this.parseDatabaseUrl(databaseUrl);
      this.logger.log(`Connecting to MSSQL at ${config.server}:${config.port}/${config.database}`);

      this.pool = await sql.connect(config);
      this.logger.log('Successfully connected to MSSQL database');
    } catch (error) {
      this.logger.error(`Failed to connect to MSSQL: ${error.message}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      this.logger.log('Disconnected from MSSQL database');
    }
  }

  getPool(): sql.ConnectionPool {
    if (!this.pool) {
      throw new Error('Database connection not established');
    }
    return this.pool;
  }

  isConnected(): boolean {
    return this.pool !== null && this.pool.connected;
  }
}
