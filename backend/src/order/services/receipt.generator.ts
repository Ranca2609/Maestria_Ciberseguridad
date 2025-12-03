import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IReceiptGenerator, IOrder, IReceipt } from '../../shared/interfaces';

@Injectable()
export class ReceiptGenerator implements IReceiptGenerator {
  /**
   * Genera un recibo a partir de una orden.
   * El recibo contiene toda la información de la orden más metadatos adicionales.
   */
  generate(order: IOrder): IReceipt {
    const totalQuetzales = order.breakdown.totalCents / 100;
    const formattedTotal = `Q ${totalQuetzales.toFixed(2)}`;

    return {
      receiptId: uuidv4(),
      orderId: order.orderId,
      generatedAt: new Date(),
      originZone: order.originZone,
      destinationZone: order.destinationZone,
      serviceType: order.serviceType,
      orderStatus: order.status,
      orderCreatedAt: order.createdAt,
      packages: order.packages,
      insuranceEnabled: order.insuranceEnabled,
      discount: order.discount,
      breakdown: order.breakdown,
      formattedTotal,
    };
  }
}
