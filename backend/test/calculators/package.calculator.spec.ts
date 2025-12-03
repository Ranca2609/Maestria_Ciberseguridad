import { PackageCalculator } from '../../src/order/calculators/package.calculator';
import { IPackage } from '../../src/shared/interfaces';

describe('PackageCalculator', () => {
  let calculator: PackageCalculator;

  beforeEach(() => {
    calculator = new PackageCalculator();
  });

  describe('calculateVolumetricKg', () => {
    it('debe calcular el peso volumétrico correctamente', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 50,
        widthCm: 40,
        lengthCm: 30,
        fragile: false,
        declaredValueCents: 0,
      };

      // (50 * 40 * 30) / 5000 = 60000 / 5000 = 12 kg
      const result = calculator.calculateVolumetricKg(pkg);
      expect(result).toBe(12);
    });

    it('debe calcular peso volumétrico con dimensiones pequeñas', () => {
      const pkg: IPackage = {
        weightKg: 1,
        heightCm: 10,
        widthCm: 10,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: 0,
      };

      // (10 * 10 * 10) / 5000 = 1000 / 5000 = 0.2 kg
      const result = calculator.calculateVolumetricKg(pkg);
      expect(result).toBe(0.2);
    });

    it('debe manejar dimensiones decimales', () => {
      const pkg: IPackage = {
        weightKg: 1,
        heightCm: 25.5,
        widthCm: 20,
        lengthCm: 15,
        fragile: false,
        declaredValueCents: 0,
      };

      // (25.5 * 20 * 15) / 5000 = 7650 / 5000 = 1.53 kg
      const result = calculator.calculateVolumetricKg(pkg);
      expect(result).toBeCloseTo(1.53, 2);
    });
  });

  describe('calculateBillableKg', () => {
    it('debe retornar peso real cuando es mayor que volumétrico', () => {
      const pkg: IPackage = {
        weightKg: 15,
        heightCm: 50,
        widthCm: 40,
        lengthCm: 30,
        fragile: false,
        declaredValueCents: 0,
      };

      // Volumétrico = 12 kg, Peso real = 15 kg
      const result = calculator.calculateBillableKg(pkg);
      expect(result).toBe(15);
    });

    it('debe retornar peso volumétrico cuando es mayor que real', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 50,
        widthCm: 40,
        lengthCm: 30,
        fragile: false,
        declaredValueCents: 0,
      };

      // Volumétrico = 12 kg, Peso real = 5 kg
      const result = calculator.calculateBillableKg(pkg);
      expect(result).toBe(12);
    });

    it('debe retornar el mismo valor cuando peso real y volumétrico son iguales', () => {
      const pkg: IPackage = {
        weightKg: 12,
        heightCm: 50,
        widthCm: 40,
        lengthCm: 30,
        fragile: false,
        declaredValueCents: 0,
      };

      // Volumétrico = 12 kg, Peso real = 12 kg
      const result = calculator.calculateBillableKg(pkg);
      expect(result).toBe(12);
    });
  });

  describe('processPackage', () => {
    it('debe agregar cálculos al paquete', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 50,
        widthCm: 40,
        lengthCm: 30,
        fragile: true,
        declaredValueCents: 10000,
      };

      const result = calculator.processPackage(pkg);

      expect(result.weightKg).toBe(5);
      expect(result.heightCm).toBe(50);
      expect(result.widthCm).toBe(40);
      expect(result.lengthCm).toBe(30);
      expect(result.fragile).toBe(true);
      expect(result.declaredValueCents).toBe(10000);
      expect(result.volumetricKg).toBe(12);
      expect(result.billableKg).toBe(12);
    });
  });
});
