// src/types/receipt.types.ts

import { ReceiptLine } from './order.types';

export interface ReceiptContent {
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

export interface ReceiptResponse {
  receiptId: string;
  orderId: string;
  generatedAt: string;
  status: number; // 1 = generado, etc.
  content: ReceiptContent;
  format: string;
  version: string;
  meta: {
    totalAmount: number;
    currency: string;
    [key: string]: any;
  };
}