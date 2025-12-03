import { DiscountValidator } from '../../src/order/validators/discount.validator';
import { IDiscount } from '../../src/shared/interfaces';
import { DiscountType } from '../../src/shared/enums';

describe('DiscountValidator', () => {
  let validator: DiscountValidator;

  beforeEach(() => {
    validator = new DiscountValidator();
  });

  describe('validate', () => {
    it('debe validar descuento NONE', () => {
      const discount: IDiscount = {
        type: DiscountType.NONE,
        value: 0,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(true);
    });

    it('debe validar descuento PERCENT dentro del límite', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 20,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(true);
    });

    it('debe validar descuento PERCENT en el límite máximo (35%)', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 35,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar descuento PERCENT mayor a 35%', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 36,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Descuento PERCENT: value no puede exceder 35%');
    });

    it('debe rechazar descuento PERCENT de 50%', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 50,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Descuento PERCENT: value no puede exceder 35%');
    });

    it('debe rechazar descuento PERCENT negativo', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: -10,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Descuento PERCENT: value debe ser mayor o igual a 0',
      );
    });

    it('debe validar descuento FIXED positivo', () => {
      const discount: IDiscount = {
        type: DiscountType.FIXED,
        value: 1000,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar descuento FIXED negativo', () => {
      const discount: IDiscount = {
        type: DiscountType.FIXED,
        value: -500,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Descuento FIXED: value debe ser mayor o igual a 0',
      );
    });

    it('debe validar descuento nulo como válido (se trata como NONE)', () => {
      const result = validator.validate(null as any);
      expect(result.isValid).toBe(true);
    });

    it('debe validar descuento undefined como válido (se trata como NONE)', () => {
      const result = validator.validate(undefined as any);
      expect(result.isValid).toBe(true);
    });

    it('debe validar descuento UNSPECIFIED', () => {
      const discount: IDiscount = {
        type: DiscountType.DISCOUNT_TYPE_UNSPECIFIED,
        value: 0,
      };

      const result = validator.validate(discount);
      expect(result.isValid).toBe(true);
    });
  });
});
