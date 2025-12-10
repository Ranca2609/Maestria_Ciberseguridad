import { Injectable } from '@nestjs/common';
import {
  ICalculatePriceRequest,
  ICalculatePriceResponse,
  IBreakdown,
  IPricingCalculator,
} from '../interfaces/pricing.interface';
import { PackageCalculator } from './package.calculator';
import { RateCalculator } from './rate.calculator';
import { ServiceCalculator } from './service.calculator';
import { SurchargeCalculator } from './surcharge.calculator';
import { DiscountCalculator } from './discount.calculator';

@Injectable()
export class PricingCalculator implements IPricingCalculator {
  constructor(
    private readonly packageCalculator: PackageCalculator,
    private readonly rateCalculator: RateCalculator,
    private readonly serviceCalculator: ServiceCalculator,
    private readonly surchargeCalculator: SurchargeCalculator,
    private readonly discountCalculator: DiscountCalculator,
  ) {}

  calculate(request: ICalculatePriceRequest): ICalculatePriceResponse {
    // Validar paquetes
    const packageValidation = this.validatePackages(request.packages);
    if (!packageValidation.valid) {
      return this.errorResponse(packageValidation.error!);
    }

    // Validar seguro
    if (request.insuranceEnabled) {
      const totalDeclaredValue = this.surchargeCalculator.getTotalDeclaredValue(request.packages);
      if (totalDeclaredValue <= 0) {
        return this.errorResponse('Si el seguro está habilitado, el valor declarado total debe ser mayor a 0');
      }
    }

    // Validar descuento
    const discountValidation = this.discountCalculator.validateDiscount(request.discount);
    if (!discountValidation.valid) {
      return this.errorResponse(discountValidation.error!);
    }

    // Calcular
    const breakdown = this.calculateBreakdown(request);

    return {
      breakdown,
      valid: true,
      errorMessage: '',
    };
  }

  private calculateBreakdown(request: ICalculatePriceRequest): IBreakdown {
    // 1. Peso tarifable total
    const orderBillableKg = this.packageCalculator.calculateTotalBillableWeight(request.packages);

    // 2. Tarifa base
    const ratePerKg = this.rateCalculator.getRatePerKg(request.destinationZone);
    const baseSubtotal = this.rateCalculator.calculateBaseSubtotal(orderBillableKg, request.destinationZone);

    // 3. Multiplicador de servicio
    const serviceMultiplier = this.serviceCalculator.getMultiplier(request.serviceType);
    const serviceSubtotal = this.serviceCalculator.calculateServiceSubtotal(baseSubtotal, request.serviceType);

    // 4. Recargos
    const fragileSurcharge = this.surchargeCalculator.calculateFragileSurcharge(request.packages);
    const insuranceSurcharge = this.surchargeCalculator.calculateInsuranceSurcharge(
      request.packages,
      request.insuranceEnabled
    );
    const subtotalWithSurcharges = serviceSubtotal + fragileSurcharge + insuranceSurcharge;

    // 5. Descuento
    const discountAmount = this.discountCalculator.calculateDiscount(subtotalWithSurcharges, request.discount);

    // 6. Total final (redondeado a 2 decimales)
    const total = Math.round((subtotalWithSurcharges - discountAmount) * 100) / 100;

    // Detalles adicionales
    const fragilePackagesCount = this.surchargeCalculator.countFragilePackages(request.packages);
    const declaredValueTotal = this.surchargeCalculator.getTotalDeclaredValue(request.packages);

    return {
      orderBillableKg: Math.round(orderBillableKg * 100) / 100,
      baseSubtotal: Math.round(baseSubtotal * 100) / 100,
      serviceSubtotal: Math.round(serviceSubtotal * 100) / 100,
      fragileSurcharge: Math.round(fragileSurcharge * 100) / 100,
      insuranceSurcharge: Math.round(insuranceSurcharge * 100) / 100,
      subtotalWithSurcharges: Math.round(subtotalWithSurcharges * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total: Math.max(0, total), // El total no puede ser negativo
      ratePerKg,
      serviceMultiplier,
      fragilePackagesCount,
      declaredValueTotal: Math.round(declaredValueTotal * 100) / 100,
    };
  }

  private validatePackages(packages: any[]): { valid: boolean; error?: string } {
    if (!packages || packages.length === 0) {
      return { valid: false, error: 'Debe incluir al menos un paquete' };
    }

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      if (pkg.weightKg <= 0) {
        return { valid: false, error: `Paquete ${i + 1}: el peso debe ser mayor a 0` };
      }
      if (pkg.heightCm <= 0 || pkg.widthCm <= 0 || pkg.lengthCm <= 0) {
        return { valid: false, error: `Paquete ${i + 1}: las dimensiones deben ser mayores a 0` };
      }
      if (pkg.declaredValueQ < 0) {
        return { valid: false, error: `Paquete ${i + 1}: el valor declarado no puede ser negativo` };
      }
    }

    return { valid: true };
  }

  private errorResponse(message: string): ICalculatePriceResponse {
    return {
      breakdown: {} as IBreakdown,
      valid: false,
      errorMessage: message,
    };
  }
}
