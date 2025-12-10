import { Controller } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { PricingCalculator } from './calculators';
import { ICalculatePriceRequest } from './interfaces/pricing.interface';

@Controller()
export class PricingController {
  constructor(private readonly pricingCalculator: PricingCalculator) {}

  @GrpcMethod('PricingService', 'CalculatePrice')
  calculatePrice(request: ICalculatePriceRequest) {
    const result = this.pricingCalculator.calculate(request);

    if (!result.valid) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: result.errorMessage,
      });
    }

    return {
      breakdown: {
        orderBillableKg: result.breakdown.orderBillableKg,
        baseSubtotal: result.breakdown.baseSubtotal,
        serviceSubtotal: result.breakdown.serviceSubtotal,
        fragileSurcharge: result.breakdown.fragileSurcharge,
        insuranceSurcharge: result.breakdown.insuranceSurcharge,
        subtotalWithSurcharges: result.breakdown.subtotalWithSurcharges,
        discountAmount: result.breakdown.discountAmount,
        total: result.breakdown.total,
        ratePerKg: result.breakdown.ratePerKg,
        serviceMultiplier: result.breakdown.serviceMultiplier,
        fragilePackagesCount: result.breakdown.fragilePackagesCount,
        declaredValueTotal: result.breakdown.declaredValueTotal,
      },
      valid: true,
      errorMessage: '',
    };
  }
}
