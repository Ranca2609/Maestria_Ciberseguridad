import { SurchargeCalculator } from '../../src/order/calculators/surcharge.calculator';
import { IPackage } from '../../src/shared/interfaces';

describe('SurchargeCalculator', () => {
  let calculator: SurchargeCalculator;

  beforeEach(() => {
    calculator = new SurchargeCalculator();
  });

  describe('calculateFragileSurcharge', () => {
    it('debe calcular recargo de Q7.00 (700 centavos) por paquete frágil', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: true,
          declaredValueCents: 0,
        },
      ];

      const result = calculator.calculateFragileSurcharge(packages);
      expect(result).toBe(700);
    });

    it('debe calcular recargo total para múltiples paquetes frágiles', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: true,
          declaredValueCents: 0,
        },
        {
          weightKg: 3,
          heightCm: 20,
          widthCm: 15,
          lengthCm: 10,
          fragile: true,
          declaredValueCents: 0,
        },
        {
          weightKg: 2,
          heightCm: 10,
          widthCm: 10,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      // 2 paquetes frágiles * 700 = 1400 centavos
      const result = calculator.calculateFragileSurcharge(packages);
      expect(result).toBe(1400);
    });

    it('debe retornar 0 si no hay paquetes frágiles', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const result = calculator.calculateFragileSurcharge(packages);
      expect(result).toBe(0);
    });

    it('debe retornar 0 para lista vacía', () => {
      const result = calculator.calculateFragileSurcharge([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateInsuranceSurcharge', () => {
    it('debe calcular 2.5% del valor declarado total cuando seguro está activo', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 100000, // Q1000.00
        },
      ];

      // 2.5% de 100000 = 2500 centavos
      const result = calculator.calculateInsuranceSurcharge(packages, true);
      expect(result).toBe(2500);
    });

    it('debe sumar valores declarados de múltiples paquetes', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 50000, // Q500.00
        },
        {
          weightKg: 3,
          heightCm: 20,
          widthCm: 15,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 30000, // Q300.00
        },
      ];

      // 2.5% de 80000 = 2000 centavos
      const result = calculator.calculateInsuranceSurcharge(packages, true);
      expect(result).toBe(2000);
    });

    it('debe retornar 0 cuando seguro está desactivado', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 100000,
        },
      ];

      const result = calculator.calculateInsuranceSurcharge(packages, false);
      expect(result).toBe(0);
    });

    it('debe retornar 0 cuando valor declarado es 0 y seguro está activo', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const result = calculator.calculateInsuranceSurcharge(packages, true);
      expect(result).toBe(0);
    });
  });
});
