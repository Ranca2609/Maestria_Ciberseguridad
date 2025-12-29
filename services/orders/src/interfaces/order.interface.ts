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

export interface IPricingResponse {
  valid: boolean;
  errorMessage?: string;
  breakdown: IBreakdown;
}

export interface IOrder {
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
  cancelledAt?: string;
}

export interface IOrderSummary {
  orderId: string;
  destinationZone: Zone;
  serviceType: ServiceType;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

// Request/Response interfaces
export interface ICreateOrderRequest {
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: IPackage[];
  discount?: IDiscount;
  insuranceEnabled: boolean;
  idempotencyKey?: string;
}

export interface ICreateOrderResponse {
  orderId: string;
  status: OrderStatus;
  createdAt: string;
  breakdown: IBreakdown;
  total: number;
}

export interface IListOrdersRequest {
  page: number;
  pageSize: number;
}

export interface IListOrdersResponse {
  orders: IOrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IGetOrderRequest {
  orderId: string;
}

export interface IGetOrderResponse {
  order: IOrder;
}

export interface ICancelOrderRequest {
  orderId: string;
}

export interface ICancelOrderResponse {
  orderId: string;
  status: OrderStatus;
  cancelledAt: string;
}

export interface IGetOrderForReceiptRequest {
  orderId: string;
}

export interface IGetOrderForReceiptResponse {
  order: IOrder;
}

// Repository interface (DIP) - async for database support
export interface IOrderRepository {
  save(order: IOrder): Promise<IOrder> | IOrder;
  findById(orderId: string): Promise<IOrder | null> | IOrder | null;
  findAll(): Promise<IOrder[]> | IOrder[];
  update(order: IOrder): Promise<IOrder> | IOrder;
}

// Idempotency store interface
export interface IIdempotencyStore {
  get(key: string): { payloadHash: string; response: ICreateOrderResponse } | null;
  set(key: string, payloadHash: string, response: ICreateOrderResponse): void;
}
