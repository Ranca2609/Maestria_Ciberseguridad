import { Injectable } from '@nestjs/common';
import {
  IPackageCalculator,
  IPackage,
  IPackageWithCalculations,
} from '../../shared/interfaces';

@Injectable()
export class PackageCalculator implements IPackageCalculator {
  /**
   * Calcula el peso volumétrico del paquete.
   * Fórmula: (height * width * length) / 5000
   */
  calculateVolumetricKg(pkg: IPackage): number {
    const volumetric = (pkg.heightCm * pkg.widthCm * pkg.lengthCm) / 5000;
    return Math.round(volumetric * 1000000) / 1000000; // Precisión de 6 decimales
  }

  /**
   * Calcula el peso tarifable del paquete.
   * Es el máximo entre el peso real y el peso volumétrico.
   */
  calculateBillableKg(pkg: IPackage): number {
    const volumetricKg = this.calculateVolumetricKg(pkg);
    return Math.max(pkg.weightKg, volumetricKg);
  }

  /**
   * Procesa un paquete agregando los cálculos de peso volumétrico y tarifable.
   */
  processPackage(pkg: IPackage): IPackageWithCalculations {
    const volumetricKg = this.calculateVolumetricKg(pkg);
    const billableKg = Math.max(pkg.weightKg, volumetricKg);

    return {
      ...pkg,
      volumetricKg,
      billableKg,
    };
  }
}
