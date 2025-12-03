import { IPackage } from './package.interface';
import { IDiscount } from './discount.interface';
import { Zone, ServiceType } from '../enums';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface IPackageValidator {
  validate(pkg: IPackage, index: number): ValidationResult;
  validateAll(packages: IPackage[]): ValidationResult;
}

export interface IDiscountValidator {
  validate(discount: IDiscount): ValidationResult;
}

export interface IInsuranceValidator {
  validate(packages: IPackage[], insuranceEnabled: boolean): ValidationResult;
}

export interface IOrderValidator {
  validateCreateOrder(
    originZone: Zone,
    destinationZone: Zone,
    serviceType: ServiceType,
    packages: IPackage[],
    discount: IDiscount,
    insuranceEnabled: boolean,
  ): ValidationResult;
}

export const PACKAGE_VALIDATOR = 'PACKAGE_VALIDATOR';
export const DISCOUNT_VALIDATOR = 'DISCOUNT_VALIDATOR';
export const INSURANCE_VALIDATOR = 'INSURANCE_VALIDATOR';
export const ORDER_VALIDATOR = 'ORDER_VALIDATOR';
