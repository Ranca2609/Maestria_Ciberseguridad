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

export enum OrderStatus {
  STATUS_UNSPECIFIED = 0,
  STATUS_ACTIVE = 1,
  STATUS_CANCELLED = 2,
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

export interface IOrderData {
  orderId: string;
  createdAt: string;
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: IPackage[];
  discount?: IDiscount;
  insuranceEnabled: boolean;
  status: OrderStatus;
  breakdown: IBreakdown;
  total: number;
}

export interface IReceiptLine {
  description: string;
  amount: number;
}

export interface IReceipt {
  receiptId: string;
  orderId: string;
  generatedAt: string;
  status: string;
  originZone: string;
  destinationZone: string;
  serviceType: string;
  packagesCount: number;
  lines: IReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  insuranceEnabled: boolean;
  declaredValue: number;
}

export interface IGenerateReceiptRequest {
  order: IOrderData;
}

export interface IGenerateReceiptResponse {
  receipt: IReceipt;
}

export interface IReceiptGenerator {
  generate(order: IOrderData): IReceipt;
}
