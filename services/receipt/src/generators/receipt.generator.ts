import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IOrderData,
  IReceipt,
  IReceiptLine,
  IReceiptGenerator,
  Zone,
  ServiceType,
  OrderStatus,
} from '../interfaces/receipt.interface';

@Injectable()
export class ReceiptGenerator implements IReceiptGenerator {
  private readonly ZONE_NAMES: Record<Zone, string> = {
    [Zone.ZONE_UNSPECIFIED]: 'No especificado',
    [Zone.ZONE_METRO]: 'Metropolitana',
    [Zone.ZONE_INTERIOR]: 'Interior',
    [Zone.ZONE_FRONTERA]: 'Frontera',
  };

  private readonly SERVICE_NAMES: Record<ServiceType, string> = {
    [ServiceType.SERVICE_UNSPECIFIED]: 'No especificado',
    [ServiceType.SERVICE_STANDARD]: 'Estándar',
    [ServiceType.SERVICE_EXPRESS]: 'Express',
    [ServiceType.SERVICE_SAME_DAY]: 'Mismo Día',
  };

  private readonly STATUS_NAMES: Record<OrderStatus, string> = {
    [OrderStatus.STATUS_UNSPECIFIED]: 'No especificado',
    [OrderStatus.STATUS_ACTIVE]: 'Activa',
    [OrderStatus.STATUS_CANCELLED]: 'Cancelada',
  };

  generate(order: IOrderData): IReceipt {
    const lines = this.generateLines(order);

    return {
      receiptId: `rcpt_${uuidv4().slice(0, 8)}`,
      orderId: order.orderId,
      generatedAt: new Date().toISOString(),
      status: this.STATUS_NAMES[order.status] || 'Desconocido',
      originZone: this.ZONE_NAMES[order.originZone] || 'Desconocido',
      destinationZone: this.ZONE_NAMES[order.destinationZone] || 'Desconocido',
      serviceType: this.SERVICE_NAMES[order.serviceType] || 'Desconocido',
      packagesCount: order.packages.length,
      lines,
      subtotal: order.breakdown.subtotalWithSurcharges,
      discount: order.breakdown.discountAmount,
      total: order.breakdown.total,
      insuranceEnabled: order.insuranceEnabled,
      declaredValue: order.breakdown.declaredValueTotal,
    };
  }

  private generateLines(order: IOrderData): IReceiptLine[] {
    const lines: IReceiptLine[] = [];
    const breakdown = order.breakdown;

    // Línea 1: Peso tarifable
    lines.push({
      description: `Peso tarifable: ${breakdown.orderBillableKg} kg x Q${breakdown.ratePerKg}/kg`,
      amount: breakdown.baseSubtotal,
    });

    // Línea 2: Multiplicador de servicio (si aplica)
    if (breakdown.serviceMultiplier !== 1) {
      lines.push({
        description: `Servicio ${this.SERVICE_NAMES[order.serviceType]} (x${breakdown.serviceMultiplier})`,
        amount: breakdown.serviceSubtotal - breakdown.baseSubtotal,
      });
    }

    // Línea 3: Recargo frágil (si aplica)
    if (breakdown.fragileSurcharge > 0) {
      lines.push({
        description: `Recargo frágil (${breakdown.fragilePackagesCount} paquetes x Q7)`,
        amount: breakdown.fragileSurcharge,
      });
    }

    // Línea 4: Seguro (si aplica)
    if (breakdown.insuranceSurcharge > 0) {
      lines.push({
        description: `Seguro (2.5% de Q${breakdown.declaredValueTotal})`,
        amount: breakdown.insuranceSurcharge,
      });
    }

    // Línea 5: Descuento (si aplica)
    if (breakdown.discountAmount > 0) {
      lines.push({
        description: `Descuento aplicado`,
        amount: -breakdown.discountAmount,
      });
    }

    return lines;
  }
}
