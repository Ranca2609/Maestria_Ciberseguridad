import { Injectable, Inject } from '@nestjs/common';
import {
  IOrderValidator,
  IPackageValidator,
  IDiscountValidator,
  IInsuranceValidator,
  IPackage,
  IDiscount,
  ValidationResult,
  PACKAGE_VALIDATOR,
  DISCOUNT_VALIDATOR,
  INSURANCE_VALIDATOR,
} from '../../shared/interfaces';
import { Zone, ServiceType } from '../../shared/enums';

@Injectable()
export class OrderValidator implements IOrderValidator {
  constructor(
    @Inject(PACKAGE_VALIDATOR)
    private readonly packageValidator: IPackageValidator,
    @Inject(DISCOUNT_VALIDATOR)
    private readonly discountValidator: IDiscountValidator,
    @Inject(INSURANCE_VALIDATOR)
    private readonly insuranceValidator: IInsuranceValidator,
  ) {}

  /**
   * Valida todos los campos de una solicitud de creación de orden.
   */
  validateCreateOrder(
    originZone: Zone,
    destinationZone: Zone,
    serviceType: ServiceType,
    packages: IPackage[],
    discount: IDiscount,
    insuranceEnabled: boolean,
  ): ValidationResult {
    const errors: string[] = [];

    // Validar zona de origen
    if (
      originZone === undefined ||
      originZone === null ||
      originZone === Zone.ZONE_UNSPECIFIED
    ) {
      errors.push('originZone es requerido y debe ser METRO, INTERIOR o FRONTERA');
    }

    // Validar zona de destino
    if (
      destinationZone === undefined ||
      destinationZone === null ||
      destinationZone === Zone.ZONE_UNSPECIFIED
    ) {
      errors.push('destinationZone es requerido y debe ser METRO, INTERIOR o FRONTERA');
    }

    // Validar tipo de servicio
    if (
      serviceType === undefined ||
      serviceType === null ||
      serviceType === ServiceType.SERVICE_TYPE_UNSPECIFIED
    ) {
      errors.push('serviceType es requerido y debe ser STANDARD, EXPRESS o SAME_DAY');
    }

    // Validar paquetes
    const packagesResult = this.packageValidator.validateAll(packages);
    errors.push(...packagesResult.errors);

    // Validar descuento
    const discountResult = this.discountValidator.validate(discount);
    errors.push(...discountResult.errors);

    // Validar seguro
    if (packages && packages.length > 0) {
      const insuranceResult = this.insuranceValidator.validate(
        packages,
        insuranceEnabled,
      );
      errors.push(...insuranceResult.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
