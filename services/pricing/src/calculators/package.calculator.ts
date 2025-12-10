import { Injectable } from '@nestjs/common';
import { IPackage, IPackageCalculator } from '../interfaces/pricing.interface';

@Injectable()
export class PackageCalculator implements IPackageCalculator {
  private readonly VOLUMETRIC_DIVISOR = 5000;

  calculateVolumetricWeight(pkg: IPackage): number {
    return (pkg.heightCm * pkg.widthCm * pkg.lengthCm) / this.VOLUMETRIC_DIVISOR;
  }

  calculateBillableWeight(pkg: IPackage): number {
    const volumetricKg = this.calculateVolumetricWeight(pkg);
    return Math.max(pkg.weightKg, volumetricKg);
  }

  calculateTotalBillableWeight(packages: IPackage[]): number {
    return packages.reduce((total, pkg) => total + this.calculateBillableWeight(pkg), 0);
  }
}
