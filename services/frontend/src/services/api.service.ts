import {
  CreateOrderRequest,
  CreateOrderResponse,
  ListOrdersResponse,
  OrderDetail,
  CancelOrderResponse,
  Receipt,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  async createOrder(order: CreateOrderRequest, idempotencyKey?: string): Promise<CreateOrderResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${API_BASE_URL}/v1/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(order),
    });
    return handleResponse<CreateOrderResponse>(response);
  },

  async listOrders(page = 1, pageSize = 20): Promise<ListOrdersResponse> {
    const response = await fetch(
      `${API_BASE_URL}/v1/orders?page=${page}&pageSize=${pageSize}`
    );
    return handleResponse<ListOrdersResponse>(response);
  },

  async getOrder(orderId: string): Promise<OrderDetail> {
    const response = await fetch(`${API_BASE_URL}/v1/orders/${orderId}`);
    return handleResponse<OrderDetail>(response);
  },

  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/orders/${orderId}/cancel`, {
      method: 'POST',
    });
    return handleResponse<CancelOrderResponse>(response);
  },

  async getReceipt(orderId: string): Promise<Receipt> {
    const response = await fetch(`${API_BASE_URL}/v1/orders/${orderId}/receipt`);
    return handleResponse<Receipt>(response);
  },
};
