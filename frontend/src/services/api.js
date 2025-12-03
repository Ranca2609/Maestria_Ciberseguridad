const API_URL = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error en la solicitud');
  }
  return data;
}

export const api = {
  async createOrder(orderData) {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse(response);
  },

  async listOrders(pageSize = 10, pageToken = '') {
    const params = new URLSearchParams();
    if (pageSize) params.append('pageSize', pageSize);
    if (pageToken) params.append('pageToken', pageToken);

    const response = await fetch(`${API_URL}/orders?${params.toString()}`);
    return handleResponse(response);
  },

  async getOrder(orderId) {
    const response = await fetch(`${API_URL}/orders/${orderId}`);
    return handleResponse(response);
  },

  async cancelOrder(orderId) {
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  async getReceipt(orderId) {
    const response = await fetch(`${API_URL}/orders/${orderId}/receipt`);
    return handleResponse(response);
  },
};

// Constantes para los enums
export const ZONES = {
  METRO: { value: 1, label: 'Metro' },
  INTERIOR: { value: 2, label: 'Interior' },
  FRONTERA: { value: 3, label: 'Frontera' },
};

export const SERVICE_TYPES = {
  STANDARD: { value: 1, label: 'Standard' },
  EXPRESS: { value: 2, label: 'Express' },
  SAME_DAY: { value: 3, label: 'Same Day' },
};

export const DISCOUNT_TYPES = {
  NONE: { value: 1, label: 'Sin descuento' },
  PERCENT: { value: 2, label: 'Porcentaje' },
  FIXED: { value: 3, label: 'Monto fijo' },
};
