import { Injectable } from '@nestjs/common';
import { IOrderRepository, IOrder } from '../../shared/interfaces';

@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private orders: Map<string, IOrder> = new Map();

  async save(order: IOrder): Promise<IOrder> {
    this.orders.set(order.orderId, { ...order });
    return this.orders.get(order.orderId)!;
  }

  async findById(orderId: string): Promise<IOrder | null> {
    const order = this.orders.get(orderId);
    return order ? { ...order } : null;
  }

  async findAll(): Promise<IOrder[]> {
    return Array.from(this.orders.values()).map((order) => ({ ...order }));
  }

  async update(order: IOrder): Promise<IOrder> {
    if (!this.orders.has(order.orderId)) {
      throw new Error(`Order ${order.orderId} not found`);
    }
    this.orders.set(order.orderId, { ...order });
    return this.orders.get(order.orderId)!;
  }

  count(): number {
    return this.orders.size;
  }

  // Método auxiliar para limpiar (útil en tests)
  clear(): void {
    this.orders.clear();
  }
}
