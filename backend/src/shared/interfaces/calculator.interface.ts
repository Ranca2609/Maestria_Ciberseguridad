import { IPackage, IPackageWithCalculations } from './package.interface';
import { IDiscount } from './discount.interface';
import { IBreakdown } from './breakdown.interface';
import { Zone, ServiceType } from '../enums';

export interface IPackageCalculator {
  calculateVolumetricKg(pkg: IPackage): number;
  calculateBillableKg(pkg: IPackage): number;
  processPackage(pkg: IPackage): IPackageWithCalculations;
}

export interface IRateCalculator {
  getRateForZone(zone: Zone): number;
  getMultiplierForService(serviceType: ServiceType): number;
}

export interface ISurchargeCalculator {
  calculateFragileSurcharge(packages: IPackage[]): number;
  calculateInsuranceSurcharge(packages: IPackage[], insuranceEnabled: boolean): number;
}

export interface IDiscountCalculator {
  calculateDiscount(discount: IDiscount, subtotal: number): number;
  applyDiscount(subtotal: number, discountAmount: number): number;
}

export interface ITariffCalculator {
  calculate(
    packages: IPackage[],
    destinationZone: Zone,
    serviceType: ServiceType,
    discount: IDiscount,
    insuranceEnabled: boolean,
  ): { packagesWithCalcs: IPackageWithCalculations[]; breakdown: IBreakdown };
}

export const PACKAGE_CALCULATOR = 'PACKAGE_CALCULATOR';
export const RATE_CALCULATOR = 'RATE_CALCULATOR';
export const SURCHARGE_CALCULATOR = 'SURCHARGE_CALCULATOR';
export const DISCOUNT_CALCULATOR = 'DISCOUNT_CALCULATOR';
export const TARIFF_CALCULATOR = 'TARIFF_CALCULATOR';
