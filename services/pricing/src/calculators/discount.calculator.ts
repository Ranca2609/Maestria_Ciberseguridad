import { Injectable } from '@nestjs/common';
import { DiscountType, IDiscount, IDiscountCalculator } from '../interfaces/pricing.interface';

@Injectable()
export class DiscountCalculator implements IDiscountCalculator {
  private readonly MAX_PERCENT_DISCOUNT = 35;

  calculateDiscount(subtotal: number, discount: IDiscount | undefined): number {
    if (!discount || discount.type === DiscountType.DISCOUNT_NONE) {
      return 0;
    }

    if (discount.type === DiscountType.DISCOUNT_PERCENT) {
      return (discount.value / 100) * subtotal;
    }

    if (discount.type === DiscountType.DISCOUNT_FIXED) {
      // El descuento fijo no puede exceder el subtotal (total mínimo = 0)
      return Math.min(discount.value, subtotal);
    }

    return 0;
  }

  validateDiscount(discount: IDiscount | undefined): { valid: boolean; error?: string } {
    if (!discount || discount.type === DiscountType.DISCOUNT_NONE) {
      return { valid: true };
    }

    if (discount.value < 0) {
      return { valid: false, error: 'El valor del descuento no puede ser negativo' };
    }

    if (discount.type === DiscountType.DISCOUNT_PERCENT && discount.value > this.MAX_PERCENT_DISCOUNT) {
      return {
        valid: false,
        error: `El descuento porcentual no puede exceder ${this.MAX_PERCENT_DISCOUNT}%`
      };
    }

    return { valid: true };
  }
}
