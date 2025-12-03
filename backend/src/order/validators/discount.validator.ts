import { Injectable } from '@nestjs/common';
import { IDiscountValidator, IDiscount, ValidationResult } from '../../shared/interfaces';
import { DiscountType } from '../../shared/enums';

@Injectable()
export class DiscountValidator implements IDiscountValidator {
  /**
   * Valida el descuento de una orden.
   * Reglas:
   * - Si type es PERCENT, value debe estar entre 0 y 35 (inclusive)
   * - Si type es FIXED, value debe ser >= 0
   */
  validate(discount: IDiscount): ValidationResult {
    const errors: string[] = [];

    if (!discount || discount.type === undefined || discount.type === null) {
      // Si no hay descuento, es válido (se trata como NONE)
      return { isValid: true, errors: [] };
    }

    switch (discount.type) {
      case DiscountType.PERCENT:
        if (discount.value === undefined || discount.value === null) {
          errors.push('Descuento PERCENT: value es requerido');
        } else if (discount.value < 0) {
          errors.push('Descuento PERCENT: value debe ser mayor o igual a 0');
        } else if (discount.value > 35) {
          errors.push('Descuento PERCENT: value no puede exceder 35%');
        }
        break;

      case DiscountType.FIXED:
        if (discount.value === undefined || discount.value === null) {
          errors.push('Descuento FIXED: value es requerido');
        } else if (discount.value < 0) {
          errors.push('Descuento FIXED: value debe ser mayor o igual a 0');
        }
        break;

      case DiscountType.NONE:
      case DiscountType.DISCOUNT_TYPE_UNSPECIFIED:
        // Válido sin restricciones adicionales
        break;

      default:
        errors.push(`Tipo de descuento no reconocido: ${discount.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
