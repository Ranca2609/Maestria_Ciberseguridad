import { Injectable } from '@nestjs/common';
import { ISurchargeCalculator, IPackage } from '../../shared/interfaces';

// Constante para el recargo por paquete frágil: 7 quetzales = 700 centavos
const FRAGILE_SURCHARGE_CENTS = 700;

// Constante para el porcentaje del seguro: 2.5% = 25/1000
const INSURANCE_RATE_PER_THOUSAND = 25;

@Injectable()
export class SurchargeCalculator implements ISurchargeCalculator {
  /**
   * Calcula el recargo total por paquetes frágiles.
   * Q7.00 (700 centavos) por cada paquete con fragile = true.
   */
  calculateFragileSurcharge(packages: IPackage[]): number {
    const fragileCount = packages.filter((pkg) => pkg.fragile).length;
    return fragileCount * FRAGILE_SURCHARGE_CENTS;
  }

  /**
   * Calcula el recargo por seguro.
   * 2.5% del valor declarado total si insuranceEnabled = true.
   * El valor declarado ya está en centavos.
   */
  calculateInsuranceSurcharge(
    packages: IPackage[],
    insuranceEnabled: boolean,
  ): number {
    if (!insuranceEnabled) {
      return 0;
    }

    const totalDeclaredValueCents = packages.reduce(
      (sum, pkg) => sum + pkg.declaredValueCents,
      0,
    );

    // 2.5% = 25/1000 = valor * 25 / 1000
    // Usando enteros para evitar problemas de punto flotante
    return Math.round((totalDeclaredValueCents * INSURANCE_RATE_PER_THOUSAND) / 1000);
  }
}
