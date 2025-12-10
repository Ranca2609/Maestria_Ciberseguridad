// Enums
export enum Zone {
  ZONE_UNSPECIFIED = 0,
  ZONE_METRO = 1,
  ZONE_INTERIOR = 2,
  ZONE_FRONTERA = 3,
}

export enum ServiceType {
  SERVICE_UNSPECIFIED = 0,
  SERVICE_STANDARD = 1,
  SERVICE_EXPRESS = 2,
  SERVICE_SAME_DAY = 3,
}

export enum DiscountType {
  DISCOUNT_NONE = 0,
  DISCOUNT_PERCENT = 1,
  DISCOUNT_FIXED = 2,
}

// Interfaces
export interface IPackage {
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  fragile: boolean;
  declaredValueQ: number;
}

export interface IDiscount {
  type: DiscountType;
  value: number;
}

export interface IBreakdown {
  orderBillableKg: number;
  baseSubtotal: number;
  serviceSubtotal: number;
  fragileSurcharge: number;
  insuranceSurcharge: number;
  subtotalWithSurcharges: number;
  discountAmount: number;
  total: number;
  ratePerKg: number;
  serviceMultiplier: number;
  fragilePackagesCount: number;
  declaredValueTotal: number;
}

export interface ICalculatePriceRequest {
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: IPackage[];
  discount?: IDiscount;
  insuranceEnabled: boolean;
}

export interface ICalculatePriceResponse {
  breakdown: IBreakdown;
  valid: boolean;
  errorMessage: string;
}

// Calculator interfaces (SOLID - DIP)
export interface IPackageCalculator {
  calculateVolumetricWeight(pkg: IPackage): number;
  calculateBillableWeight(pkg: IPackage): number;
  calculateTotalBillableWeight(packages: IPackage[]): number;
}

export interface IRateCalculator {
  getRatePerKg(zone: Zone): number;
  calculateBaseSubtotal(billableKg: number, zone: Zone): number;
}

export interface IServiceCalculator {
  getMultiplier(serviceType: ServiceType): number;
  calculateServiceSubtotal(baseSubtotal: number, serviceType: ServiceType): number;
}

export interface ISurchargeCalculator {
  calculateFragileSurcharge(packages: IPackage[]): number;
  calculateInsuranceSurcharge(packages: IPackage[], insuranceEnabled: boolean): number;
  countFragilePackages(packages: IPackage[]): number;
  getTotalDeclaredValue(packages: IPackage[]): number;
}

export interface IDiscountCalculator {
  calculateDiscount(subtotal: number, discount: IDiscount | undefined): number;
  validateDiscount(discount: IDiscount | undefined): { valid: boolean; error?: string };
}

export interface IPricingCalculator {
  calculate(request: ICalculatePriceRequest): ICalculatePriceResponse;
}
