import { Injectable } from '@nestjs/common';
import { IPackage, ISurchargeCalculator } from '../interfaces/pricing.interface';

@Injectable()
export class SurchargeCalculator implements ISurchargeCalculator {
  private readonly FRAGILE_SURCHARGE_PER_PACKAGE = 7;
  private readonly INSURANCE_RATE = 0.025; // 2.5%

  calculateFragileSurcharge(packages: IPackage[]): number {
    const fragileCount = this.countFragilePackages(packages);
    return fragileCount * this.FRAGILE_SURCHARGE_PER_PACKAGE;
  }

  calculateInsuranceSurcharge(packages: IPackage[], insuranceEnabled: boolean): number {
    if (!insuranceEnabled) {
      return 0;
    }
    const totalDeclaredValue = this.getTotalDeclaredValue(packages);
    return totalDeclaredValue * this.INSURANCE_RATE;
  }

  countFragilePackages(packages: IPackage[]): number {
    return packages.filter((pkg) => pkg.fragile).length;
  }

  getTotalDeclaredValue(packages: IPackage[]): number {
    return packages.reduce((total, pkg) => total + pkg.declaredValueQ, 0);
  }
}
