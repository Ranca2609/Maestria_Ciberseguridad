import { Injectable } from '@nestjs/common';
import { IOrder, IOrderRepository } from '../interfaces/order.interface';

@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, IOrder> = new Map();

  save(order: IOrder): IOrder {
    this.orders.set(order.orderId, { ...order });
    return order;
  }

  findById(orderId: string): IOrder | null {
    const order = this.orders.get(orderId);
    return order ? { ...order } : null;
  }

  findAll(): IOrder[] {
    return Array.from(this.orders.values()).map(order => ({ ...order }));
  }

  update(order: IOrder): IOrder {
    if (!this.orders.has(order.orderId)) {
      throw new Error(`Order ${order.orderId} not found`);
    }
    this.orders.set(order.orderId, { ...order });
    return order;
  }

  // Método para limpiar (útil en tests)
  clear(): void {
    this.orders.clear();
  }
}
