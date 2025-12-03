import { Injectable } from '@nestjs/common';
import { IDiscountCalculator, IDiscount } from '../../shared/interfaces';
import { DiscountType } from '../../shared/enums';

@Injectable()
export class DiscountCalculator implements IDiscountCalculator {
  /**
   * Calcula el monto del descuento basado en el tipo y valor.
   * - PERCENT: descuento = value/100 * subtotal (en centavos)
   * - FIXED: descuento = value (ya está en centavos)
   * - NONE: descuento = 0
   *
   * Nota: La validación de que PERCENT <= 35 debe hacerse en el validador.
   */
  calculateDiscount(discount: IDiscount, subtotal: number): number {
    switch (discount.type) {
      case DiscountType.PERCENT:
        // value es el porcentaje (0-35)
        // Calculamos: subtotal * value / 100
        return Math.round((subtotal * discount.value) / 100);

      case DiscountType.FIXED:
        // value ya está en centavos
        return discount.value;

      case DiscountType.NONE:
      case DiscountType.DISCOUNT_TYPE_UNSPECIFIED:
      default:
        return 0;
    }
  }

  /**
   * Aplica el descuento al subtotal.
   * El total no puede ser negativo: si el descuento excede el subtotal, el total queda en 0.
   */
  applyDiscount(subtotal: number, discountAmount: number): number {
    const result = subtotal - discountAmount;
    return Math.max(0, result);
  }
}
