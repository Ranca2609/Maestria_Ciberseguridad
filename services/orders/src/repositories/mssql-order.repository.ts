import { Injectable, Logger } from '@nestjs/common';
import * as sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';
import {
  IOrder,
  IOrderRepository,
  IPackage,
  IDiscount,
  IBreakdown,
  Zone,
  ServiceType,
  OrderStatus,
  DiscountType,
} from '../interfaces/order.interface';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MssqlOrderRepository implements IOrderRepository {
  private readonly logger = new Logger(MssqlOrderRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async save(order: IOrder): Promise<IOrder> {
    const pool = this.databaseService.getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Insert order
      const orderRequest = new sql.Request(transaction);
      await orderRequest
        .input('id', sql.NVarChar(36), order.orderId)
        .input('client_name', sql.NVarChar(255), 'API Order') // Default since IOrder doesn't have this field
        .input('origin_zone', sql.NVarChar(50), this.zoneToString(order.originZone))
        .input('destination_zone', sql.NVarChar(50), this.zoneToString(order.destinationZone))
        .input('service_type', sql.NVarChar(50), this.serviceTypeToString(order.serviceType))
        .input('status', sql.NVarChar(50), this.statusToString(order.status))
        .input('total_weight_kg', sql.Decimal(10, 2), order.breakdown.orderBillableKg)
        .input('base_cost', sql.Decimal(10, 2), order.breakdown.baseSubtotal)
        .input('weight_cost', sql.Decimal(10, 2), order.breakdown.serviceSubtotal)
        .input('zone_surcharge', sql.Decimal(10, 2), 0) // Not tracked separately
        .input('fragile_surcharge', sql.Decimal(10, 2), order.breakdown.fragileSurcharge)
        .input('express_surcharge', sql.Decimal(10, 2), 0) // Included in serviceSubtotal
        .input('insurance_cost', sql.Decimal(10, 2), order.breakdown.insuranceSurcharge)
        .input('subtotal', sql.Decimal(10, 2), order.breakdown.subtotalWithSurcharges)
        .input('tax', sql.Decimal(10, 2), 0) // Not implemented
        .input('total', sql.Decimal(10, 2), order.breakdown.total)
        .input('discount_type', sql.NVarChar(20), order.discount ? this.discountTypeToString(order.discount.type) : null)
        .input('discount_value', sql.Decimal(10, 2), order.discount?.value || null)
        .input('discount_amount', sql.Decimal(10, 2), order.breakdown.discountAmount)
        .input('insurance_enabled', sql.Bit, order.insuranceEnabled ? 1 : 0)
        .input('created_at', sql.DateTime, new Date(order.createdAt))
        .query(`
          INSERT INTO orders (
            id, client_name, origin_zone, destination_zone, service_type, status,
            total_weight_kg, base_cost, weight_cost, zone_surcharge,
            fragile_surcharge, express_surcharge, insurance_cost,
            subtotal, tax, total, discount_type, discount_value,
            discount_amount, insurance_enabled, created_at, updated_at
          ) VALUES (
            @id, @client_name, @origin_zone, @destination_zone, @service_type, @status,
            @total_weight_kg, @base_cost, @weight_cost, @zone_surcharge,
            @fragile_surcharge, @express_surcharge, @insurance_cost,
            @subtotal, @tax, @total, @discount_type, @discount_value,
            @discount_amount, @insurance_enabled, @created_at, GETDATE()
          )
        `);

      // Insert packages
      for (const pkg of order.packages) {
        const pkgRequest = new sql.Request(transaction);
        const pkgId = uuidv4();
        const volumetricWeight = (pkg.heightCm * pkg.widthCm * pkg.lengthCm) / 5000;

        await pkgRequest
          .input('id', sql.NVarChar(36), pkgId)
          .input('order_id', sql.NVarChar(36), order.orderId)
          .input('weight_kg', sql.Decimal(10, 2), pkg.weightKg)
          .input('height_cm', sql.Int, pkg.heightCm)
          .input('width_cm', sql.Int, pkg.widthCm)
          .input('length_cm', sql.Int, pkg.lengthCm)
          .input('fragile', sql.Bit, pkg.fragile ? 1 : 0)
          .input('declared_value_q', sql.Decimal(10, 2), pkg.declaredValueQ)
          .input('volumetric_weight', sql.Decimal(10, 2), volumetricWeight)
          .query(`
            INSERT INTO packages (
              id, order_id, weight_kg, height_cm, width_cm, length_cm,
              fragile, declared_value_q, volumetric_weight
            ) VALUES (
              @id, @order_id, @weight_kg, @height_cm, @width_cm, @length_cm,
              @fragile, @declared_value_q, @volumetric_weight
            )
          `);
      }

      await transaction.commit();
      this.logger.log(`Order ${order.orderId} saved to database`);
      return order;
    } catch (error) {
      await transaction.rollback();
      this.logger.error(`Failed to save order ${order.orderId}: ${error.message}`);
      throw error;
    }
  }

  async findById(orderId: string): Promise<IOrder | null> {
    const pool = this.databaseService.getPool();
    const request = new sql.Request(pool);

    const orderResult = await request
      .input('id', sql.NVarChar(36), orderId)
      .query(`
        SELECT * FROM orders WHERE id = @id
      `);

    if (orderResult.recordset.length === 0) {
      return null;
    }

    const orderRow = orderResult.recordset[0];

    // Fetch packages
    const pkgRequest = new sql.Request(pool);
    const pkgResult = await pkgRequest
      .input('order_id', sql.NVarChar(36), orderId)
      .query(`
        SELECT * FROM packages WHERE order_id = @order_id
      `);

    return this.rowToOrder(orderRow, pkgResult.recordset);
  }

  async findAll(): Promise<IOrder[]> {
    const pool = this.databaseService.getPool();

    const ordersResult = await pool.request().query(`
      SELECT * FROM orders ORDER BY created_at DESC
    `);

    const orders: IOrder[] = [];

    for (const orderRow of ordersResult.recordset) {
      const pkgRequest = new sql.Request(pool);
      const pkgResult = await pkgRequest
        .input('order_id', sql.NVarChar(36), orderRow.id)
        .query(`
          SELECT * FROM packages WHERE order_id = @order_id
        `);

      orders.push(this.rowToOrder(orderRow, pkgResult.recordset));
    }

    return orders;
  }

  async update(order: IOrder): Promise<IOrder> {
    const pool = this.databaseService.getPool();
    const request = new sql.Request(pool);

    await request
      .input('id', sql.NVarChar(36), order.orderId)
      .input('status', sql.NVarChar(50), this.statusToString(order.status))
      .input('cancelled_at', sql.DateTime, order.cancelledAt ? new Date(order.cancelledAt) : null)
      .query(`
        UPDATE orders
        SET status = @status,
            updated_at = GETDATE()
        WHERE id = @id
      `);

    this.logger.log(`Order ${order.orderId} updated in database`);
    return order;
  }

  // Helper methods for enum conversion
  private zoneToString(zone: Zone): string {
    const map: Record<Zone, string> = {
      [Zone.ZONE_UNSPECIFIED]: 'UNSPECIFIED',
      [Zone.ZONE_METRO]: 'METRO',
      [Zone.ZONE_INTERIOR]: 'INTERIOR',
      [Zone.ZONE_FRONTERA]: 'FRONTERA',
    };
    return map[zone] || 'UNSPECIFIED';
  }

  private stringToZone(str: string): Zone {
    const map: Record<string, Zone> = {
      'METRO': Zone.ZONE_METRO,
      'INTERIOR': Zone.ZONE_INTERIOR,
      'FRONTERA': Zone.ZONE_FRONTERA,
    };
    return map[str] || Zone.ZONE_UNSPECIFIED;
  }

  private serviceTypeToString(type: ServiceType): string {
    const map: Record<ServiceType, string> = {
      [ServiceType.SERVICE_UNSPECIFIED]: 'UNSPECIFIED',
      [ServiceType.SERVICE_STANDARD]: 'STANDARD',
      [ServiceType.SERVICE_EXPRESS]: 'EXPRESS',
      [ServiceType.SERVICE_SAME_DAY]: 'SAME_DAY',
    };
    return map[type] || 'UNSPECIFIED';
  }

  private stringToServiceType(str: string): ServiceType {
    const map: Record<string, ServiceType> = {
      'STANDARD': ServiceType.SERVICE_STANDARD,
      'EXPRESS': ServiceType.SERVICE_EXPRESS,
      'SAME_DAY': ServiceType.SERVICE_SAME_DAY,
    };
    return map[str] || ServiceType.SERVICE_UNSPECIFIED;
  }

  private statusToString(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      [OrderStatus.STATUS_UNSPECIFIED]: 'UNSPECIFIED',
      [OrderStatus.STATUS_ACTIVE]: 'ACTIVE',
      [OrderStatus.STATUS_CANCELLED]: 'CANCELLED',
    };
    return map[status] || 'PENDING';
  }

  private stringToStatus(str: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
      'ACTIVE': OrderStatus.STATUS_ACTIVE,
      'CANCELLED': OrderStatus.STATUS_CANCELLED,
      'PENDING': OrderStatus.STATUS_ACTIVE, // Map PENDING to ACTIVE
    };
    return map[str] || OrderStatus.STATUS_UNSPECIFIED;
  }

  private discountTypeToString(type: DiscountType): string {
    const map: Record<DiscountType, string> = {
      [DiscountType.DISCOUNT_NONE]: 'NONE',
      [DiscountType.DISCOUNT_PERCENT]: 'PERCENT',
      [DiscountType.DISCOUNT_FIXED]: 'FIXED',
    };
    return map[type] || 'NONE';
  }

  private stringToDiscountType(str: string): DiscountType {
    const map: Record<string, DiscountType> = {
      'PERCENT': DiscountType.DISCOUNT_PERCENT,
      'FIXED': DiscountType.DISCOUNT_FIXED,
    };
    return map[str] || DiscountType.DISCOUNT_NONE;
  }

  private rowToOrder(row: any, packages: any[]): IOrder {
    const discount: IDiscount | undefined = row.discount_type && row.discount_type !== 'NONE'
      ? {
          type: this.stringToDiscountType(row.discount_type),
          value: parseFloat(row.discount_value) || 0,
        }
      : undefined;

    const breakdown: IBreakdown = {
      orderBillableKg: parseFloat(row.total_weight_kg) || 0,
      baseSubtotal: parseFloat(row.base_cost) || 0,
      serviceSubtotal: parseFloat(row.weight_cost) || 0,
      fragileSurcharge: parseFloat(row.fragile_surcharge) || 0,
      insuranceSurcharge: parseFloat(row.insurance_cost) || 0,
      subtotalWithSurcharges: parseFloat(row.subtotal) || 0,
      discountAmount: parseFloat(row.discount_amount) || 0,
      total: parseFloat(row.total) || 0,
      ratePerKg: 0, // Not stored separately
      serviceMultiplier: 0, // Not stored separately
      fragilePackagesCount: packages.filter(p => p.fragile).length,
      declaredValueTotal: packages.reduce((sum, p) => sum + (parseFloat(p.declared_value_q) || 0), 0),
    };

    const pkgList: IPackage[] = packages.map(p => ({
      weightKg: parseFloat(p.weight_kg) || 0,
      heightCm: p.height_cm || 0,
      widthCm: p.width_cm || 0,
      lengthCm: p.length_cm || 0,
      fragile: !!p.fragile,
      declaredValueQ: parseFloat(p.declared_value_q) || 0,
    }));

    return {
      orderId: row.id,
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      originZone: this.stringToZone(row.origin_zone),
      destinationZone: this.stringToZone(row.destination_zone),
      serviceType: this.stringToServiceType(row.service_type),
      packages: pkgList,
      discount,
      insuranceEnabled: !!row.insurance_enabled,
      status: this.stringToStatus(row.status),
      breakdown,
      total: parseFloat(row.total) || 0,
      cancelledAt: row.cancelled_at?.toISOString(),
    };
  }
}
