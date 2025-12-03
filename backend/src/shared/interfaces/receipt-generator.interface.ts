import { IOrder } from './order.interface';
import { IReceipt } from './receipt.interface';

export interface IReceiptGenerator {
  generate(order: IOrder): IReceipt;
}

export const RECEIPT_GENERATOR = 'RECEIPT_GENERATOR';
