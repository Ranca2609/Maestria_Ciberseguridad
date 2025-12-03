import { DiscountType } from '../enums';

export interface IDiscount {
  type: DiscountType;
  value: number;
}
