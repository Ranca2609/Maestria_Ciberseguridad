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

  listOrders(page: number, pageSize: number): { orders: IOrder[]; totalCount: number } {
    const allOrders = Array.from(this.orders.values());
    const totalCount = allOrders.length;
    
    const sorted = allOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const orders = sorted.slice(startIndex, endIndex).map(order => ({ ...order }));
    
    return { orders, totalCount };
  }

  // Método para limpiar (útil en tests)
  clear(): void {
    this.orders.clear();
  }
}
