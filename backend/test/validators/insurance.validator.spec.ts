import { InsuranceValidator } from '../../src/order/validators/insurance.validator';
import { IPackage } from '../../src/shared/interfaces';

describe('InsuranceValidator', () => {
  let validator: InsuranceValidator;

  beforeEach(() => {
    validator = new InsuranceValidator();
  });

  describe('validate', () => {
    it('debe validar cuando seguro está desactivado', () => {
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

      const result = validator.validate(packages, false);
      expect(result.isValid).toBe(true);
    });

    it('debe validar cuando seguro está activo y hay valor declarado', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 10000,
        },
      ];

      const result = validator.validate(packages, true);
      expect(result.isValid).toBe(true);
    });

    it('debe rechazar cuando seguro está activo y suma de valores declarados es 0', () => {
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

      const result = validator.validate(packages, true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'insuranceEnabled=true requiere que la suma de declaredValueCents de todos los paquetes sea mayor a 0',
      );
    });

    it('debe rechazar cuando seguro está activo y todos los paquetes tienen valor 0', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
        {
          weightKg: 3,
          heightCm: 20,
          widthCm: 15,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const result = validator.validate(packages, true);
      expect(result.isValid).toBe(false);
    });

    it('debe validar cuando seguro está activo y al menos un paquete tiene valor declarado', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
        {
          weightKg: 3,
          heightCm: 20,
          widthCm: 15,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 5000,
        },
      ];

      const result = validator.validate(packages, true);
      expect(result.isValid).toBe(true);
    });

    it('debe sumar valores declarados de múltiples paquetes', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 3000,
        },
        {
          weightKg: 3,
          heightCm: 20,
          widthCm: 15,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 2000,
        },
      ];

      const result = validator.validate(packages, true);
      expect(result.isValid).toBe(true);
    });
  });
});
