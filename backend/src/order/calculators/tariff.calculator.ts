import { Injectable, Inject } from '@nestjs/common';
import {
  ITariffCalculator,
  IPackageCalculator,
  IRateCalculator,
  ISurchargeCalculator,
  IDiscountCalculator,
  IPackage,
  IPackageWithCalculations,
  IBreakdown,
  IDiscount,
  PACKAGE_CALCULATOR,
  RATE_CALCULATOR,
  SURCHARGE_CALCULATOR,
  DISCOUNT_CALCULATOR,
} from '../../shared/interfaces';
import { Zone, ServiceType } from '../../shared/enums';

@Injectable()
export class TariffCalculator implements ITariffCalculator {
  constructor(
    @Inject(PACKAGE_CALCULATOR)
    private readonly packageCalculator: IPackageCalculator,
    @Inject(RATE_CALCULATOR)
    private readonly rateCalculator: IRateCalculator,
    @Inject(SURCHARGE_CALCULATOR)
    private readonly surchargeCalculator: ISurchargeCalculator,
    @Inject(DISCOUNT_CALCULATOR)
    private readonly discountCalculator: IDiscountCalculator,
  ) {}

  /**
   * Calcula el desglose completo de la tarifa para una orden.
   * Todos los montos están en centavos para evitar problemas de punto flotante.
   */
  calculate(
    packages: IPackage[],
    destinationZone: Zone,
    serviceType: ServiceType,
    discount: IDiscount,
    insuranceEnabled: boolean,
  ): { packagesWithCalcs: IPackageWithCalculations[]; breakdown: IBreakdown } {
    // 1. Procesar cada paquete (calcular peso volumétrico y tarifable)
    const packagesWithCalcs = packages.map((pkg) =>
      this.packageCalculator.processPackage(pkg),
    );

    // 2. Calcular peso tarifable total
    const orderBillableKg = packagesWithCalcs.reduce(
      (sum, pkg) => sum + pkg.billableKg,
      0,
    );

    // 3. Obtener tarifa por kg según zona destino (en centavos)
    const ratePerKgCents = this.rateCalculator.getRateForZone(destinationZone);

    // 4. Calcular subtotal base (en centavos)
    // Multiplicamos kg * centavos y redondeamos
    const baseSubtotalCents = Math.round(orderBillableKg * ratePerKgCents);

    // 5. Obtener multiplicador por tipo de servicio (en porcentaje)
    const serviceMultiplierPercent =
      this.rateCalculator.getMultiplierForService(serviceType);

    // 6. Aplicar multiplicador de servicio
    // serviceSubtotal = baseSubtotal * multiplier / 100
    const serviceSubtotalCents = Math.round(
      (baseSubtotalCents * serviceMultiplierPercent) / 100,
    );

    // 7. Calcular recargos
    const fragileSurchargeCents =
      this.surchargeCalculator.calculateFragileSurcharge(packages);
    const insuranceSurchargeCents =
      this.surchargeCalculator.calculateInsuranceSurcharge(
        packages,
        insuranceEnabled,
      );

    // 8. Subtotal con recargos
    const subtotalWithSurchargesCents =
      serviceSubtotalCents + fragileSurchargeCents + insuranceSurchargeCents;

    // 9. Calcular descuento
    const discountAmountCents = this.discountCalculator.calculateDiscount(
      discount,
      subtotalWithSurchargesCents,
    );

    // 10. Aplicar descuento y obtener total
    const totalCents = this.discountCalculator.applyDiscount(
      subtotalWithSurchargesCents,
      discountAmountCents,
    );

    const breakdown: IBreakdown = {
      orderBillableKg,
      ratePerKgCents,
      baseSubtotalCents,
      serviceMultiplierPercent,
      serviceSubtotalCents,
      fragileSurchargeCents,
      insuranceSurchargeCents,
      subtotalWithSurchargesCents,
      discountAmountCents,
      totalCents,
    };

    return { packagesWithCalcs, breakdown };
  }
}
