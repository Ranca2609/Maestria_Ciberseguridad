import { Zone, ServiceType, OrderStatus } from '../enums';
import { IPackageWithCalculations } from './package.interface';
import { IDiscount } from './discount.interface';
import { IBreakdown } from './breakdown.interface';

export interface IOrder {
  orderId: string;
  createdAt: Date;
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  packages: IPackageWithCalculations[];
  discount: IDiscount;
  insuranceEnabled: boolean;
  status: OrderStatus;
  breakdown: IBreakdown;
}

export interface IOrderSummary {
  orderId: string;
  destinationZone: Zone;
  serviceType: ServiceType;
  status: OrderStatus;
  totalCents: number;
  createdAt: Date;
}
