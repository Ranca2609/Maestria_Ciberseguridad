import { IOrder, IOrderSummary } from './order.interface';

export interface IOrderRepository {
  save(order: IOrder): Promise<IOrder>;
  findById(orderId: string): Promise<IOrder | null>;
  findAll(): Promise<IOrder[]>;
  update(order: IOrder): Promise<IOrder>;
  count(): number;
}

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';
