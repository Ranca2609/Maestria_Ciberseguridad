export enum Zone {
  METRO = 'METRO',
  INTERIOR = 'INTERIOR',
  FRONTERA = 'FRONTERA',
}

export enum ServiceType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SAME_DAY = 'SAME_DAY',
}

export enum DiscountType {
  NONE = 'NONE',
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum OrderStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export interface Package {
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  fragile: boolean;
  declaredValueQ: number;
}

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface Breakdown {
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

export interface CreateOrderRequest {
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: Package[];
  discount?: Discount;
  insuranceEnabled: boolean;
}

export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  breakdown: Breakdown;
  total: number;
}

export interface OrderSummary {
  orderId: string;
  destinationZone: Zone;
  serviceType: ServiceType;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

export interface ListOrdersResponse {
  orders: OrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OrderDetail {
  orderId: string;
  createdAt: string;
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: Package[];
  discount?: Discount;
  insuranceEnabled: boolean;
  status: OrderStatus;
  breakdown: Breakdown;
  total: number;
}

export interface CancelOrderResponse {
  orderId: string;
  status: OrderStatus;
  cancelledAt: string;
}

export interface ReceiptLine {
  description: string;
  amount: number;
}

export interface Receipt {
  receiptId: string;
  orderId: string;
  generatedAt: string;
  status: string;
  originZone: string;
  destinationZone: string;
  serviceType: string;
  packagesCount: number;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  insuranceEnabled: boolean;
  declaredValue: number;
}
