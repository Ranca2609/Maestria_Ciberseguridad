import { Zone, ServiceType, OrderStatus } from '../enums';
import { IPackageWithCalculations } from './package.interface';
import { IDiscount } from './discount.interface';
import { IBreakdown } from './breakdown.interface';

export interface IReceipt {
  receiptId: string;
  orderId: string;
  generatedAt: Date;
  originZone: Zone;
  destinationZone: Zone;
  serviceType: ServiceType;
  orderStatus: OrderStatus;
  orderCreatedAt: Date;
  packages: IPackageWithCalculations[];
  insuranceEnabled: boolean;
  discount: IDiscount;
  breakdown: IBreakdown;
  formattedTotal: string;
}
