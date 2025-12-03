import { Injectable } from '@nestjs/common';
import { IPackageValidator, IPackage, ValidationResult } from '../../shared/interfaces';

@Injectable()
export class PackageValidator implements IPackageValidator {
  /**
   * Valida un paquete individual.
   * Reglas:
   * - weightKg debe ser > 0
   * - heightCm debe ser > 0
   * - widthCm debe ser > 0
   * - lengthCm debe ser > 0
   * - declaredValueCents debe ser >= 0
   */
  validate(pkg: IPackage, index: number): ValidationResult {
    const errors: string[] = [];

    if (pkg.weightKg === undefined || pkg.weightKg === null) {
      errors.push(`Paquete ${index + 1}: weightKg es requerido`);
    } else if (pkg.weightKg <= 0) {
      errors.push(`Paquete ${index + 1}: weightKg debe ser mayor que 0`);
    }

    if (pkg.heightCm === undefined || pkg.heightCm === null) {
      errors.push(`Paquete ${index + 1}: heightCm es requerido`);
    } else if (pkg.heightCm <= 0) {
      errors.push(`Paquete ${index + 1}: heightCm debe ser mayor que 0`);
    }

    if (pkg.widthCm === undefined || pkg.widthCm === null) {
      errors.push(`Paquete ${index + 1}: widthCm es requerido`);
    } else if (pkg.widthCm <= 0) {
      errors.push(`Paquete ${index + 1}: widthCm debe ser mayor que 0`);
    }

    if (pkg.lengthCm === undefined || pkg.lengthCm === null) {
      errors.push(`Paquete ${index + 1}: lengthCm es requerido`);
    } else if (pkg.lengthCm <= 0) {
      errors.push(`Paquete ${index + 1}: lengthCm debe ser mayor que 0`);
    }

    if (pkg.declaredValueCents === undefined || pkg.declaredValueCents === null) {
      errors.push(`Paquete ${index + 1}: declaredValueCents es requerido`);
    } else if (pkg.declaredValueCents < 0) {
      errors.push(`Paquete ${index + 1}: declaredValueCents debe ser mayor o igual a 0`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida todos los paquetes de una orden.
   */
  validateAll(packages: IPackage[]): ValidationResult {
    const errors: string[] = [];

    if (!packages || packages.length === 0) {
      return {
        isValid: false,
        errors: ['La orden debe contener al menos un paquete'],
      };
    }

    packages.forEach((pkg, index) => {
      const result = this.validate(pkg, index);
      errors.push(...result.errors);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
