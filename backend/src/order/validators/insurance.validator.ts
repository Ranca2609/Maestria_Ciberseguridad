import { Injectable } from '@nestjs/common';
import { IInsuranceValidator, IPackage, ValidationResult } from '../../shared/interfaces';

@Injectable()
export class InsuranceValidator implements IInsuranceValidator {
  /**
   * Valida la regla del seguro.
   * Regla: Si insuranceEnabled = true, entonces sum(declaredValueCents) debe ser > 0.
   */
  validate(packages: IPackage[], insuranceEnabled: boolean): ValidationResult {
    if (!insuranceEnabled) {
      return { isValid: true, errors: [] };
    }

    const totalDeclaredValue = packages.reduce(
      (sum, pkg) => sum + (pkg.declaredValueCents || 0),
      0,
    );

    if (totalDeclaredValue <= 0) {
      return {
        isValid: false,
        errors: [
          'insuranceEnabled=true requiere que la suma de declaredValueCents de todos los paquetes sea mayor a 0',
        ],
      };
    }

    return { isValid: true, errors: [] };
  }
}
