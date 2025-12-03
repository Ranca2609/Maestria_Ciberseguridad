import { DiscountCalculator } from '../../src/order/calculators/discount.calculator';
import { IDiscount } from '../../src/shared/interfaces';
import { DiscountType } from '../../src/shared/enums';

describe('DiscountCalculator', () => {
  let calculator: DiscountCalculator;

  beforeEach(() => {
    calculator = new DiscountCalculator();
  });

  describe('calculateDiscount', () => {
    it('debe calcular descuento PERCENT correctamente', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 20,
      };

      // 20% de 10000 = 2000 centavos
      const result = calculator.calculateDiscount(discount, 10000);
      expect(result).toBe(2000);
    });

    it('debe calcular descuento PERCENT con límite máximo 35%', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 35,
      };

      // 35% de 10000 = 3500 centavos
      const result = calculator.calculateDiscount(discount, 10000);
      expect(result).toBe(3500);
    });

    it('debe retornar el valor exacto para descuento FIXED', () => {
      const discount: IDiscount = {
        type: DiscountType.FIXED,
        value: 1500,
      };

      const result = calculator.calculateDiscount(discount, 10000);
      expect(result).toBe(1500);
    });

    it('debe retornar 0 para descuento NONE', () => {
      const discount: IDiscount = {
        type: DiscountType.NONE,
        value: 0,
      };

      const result = calculator.calculateDiscount(discount, 10000);
      expect(result).toBe(0);
    });

    it('debe retornar 0 para tipo no especificado', () => {
      const discount: IDiscount = {
        type: DiscountType.DISCOUNT_TYPE_UNSPECIFIED,
        value: 0,
      };

      const result = calculator.calculateDiscount(discount, 10000);
      expect(result).toBe(0);
    });

    it('debe manejar descuento PERCENT de 0%', () => {
      const discount: IDiscount = {
        type: DiscountType.PERCENT,
        value: 0,
      };

      const result = calculator.calculateDiscount(discount, 10000);
      expect(result).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('debe aplicar descuento correctamente', () => {
      const result = calculator.applyDiscount(10000, 2000);
      expect(result).toBe(8000);
    });

    it('debe truncar a 0 si el descuento excede el subtotal', () => {
      const result = calculator.applyDiscount(5000, 7000);
      expect(result).toBe(0);
    });

    it('debe retornar 0 si descuento es igual al subtotal', () => {
      const result = calculator.applyDiscount(5000, 5000);
      expect(result).toBe(0);
    });

    it('debe manejar descuento de 0', () => {
      const result = calculator.applyDiscount(10000, 0);
      expect(result).toBe(10000);
    });
  });
});
