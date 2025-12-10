import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ReceiptGenerator } from './generators';
import { IGenerateReceiptRequest } from './interfaces/receipt.interface';

@Controller()
export class ReceiptController {
  constructor(private readonly receiptGenerator: ReceiptGenerator) {}

  @GrpcMethod('ReceiptService', 'GenerateReceipt')
  generateReceipt(request: IGenerateReceiptRequest) {
    const receipt = this.receiptGenerator.generate(request.order);

    return {
      receipt: {
        receiptId: receipt.receiptId,
        orderId: receipt.orderId,
        generatedAt: receipt.generatedAt,
        status: receipt.status,
        originZone: receipt.originZone,
        destinationZone: receipt.destinationZone,
        serviceType: receipt.serviceType,
        packagesCount: receipt.packagesCount,
        lines: receipt.lines,
        subtotal: receipt.subtotal,
        discount: receipt.discount,
        total: receipt.total,
        insuranceEnabled: receipt.insuranceEnabled,
        declaredValue: receipt.declaredValue,
      },
    };
  }
}
