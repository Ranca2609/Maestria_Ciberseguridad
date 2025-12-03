import { PackageValidator } from '../../src/order/validators/package.validator';
import { IPackage } from '../../src/shared/interfaces';

describe('PackageValidator', () => {
  let validator: PackageValidator;

  beforeEach(() => {
    validator = new PackageValidator();
  });

  describe('validate', () => {
    it('debe validar un paquete correcto', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 30,
        widthCm: 20,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: 0,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar peso menor o igual a 0', () => {
      const pkg: IPackage = {
        weightKg: 0,
        heightCm: 30,
        widthCm: 20,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: 0,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paquete 1: weightKg debe ser mayor que 0');
    });

    it('debe rechazar peso negativo', () => {
      const pkg: IPackage = {
        weightKg: -5,
        heightCm: 30,
        widthCm: 20,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: 0,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paquete 1: weightKg debe ser mayor que 0');
    });

    it('debe rechazar altura menor o igual a 0', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 0,
        widthCm: 20,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: 0,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paquete 1: heightCm debe ser mayor que 0');
    });

    it('debe rechazar ancho menor o igual a 0', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 30,
        widthCm: 0,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: 0,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paquete 1: widthCm debe ser mayor que 0');
    });

    it('debe rechazar largo menor o igual a 0', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 30,
        widthCm: 20,
        lengthCm: 0,
        fragile: false,
        declaredValueCents: 0,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paquete 1: lengthCm debe ser mayor que 0');
    });

    it('debe rechazar valor declarado negativo', () => {
      const pkg: IPackage = {
        weightKg: 5,
        heightCm: 30,
        widthCm: 20,
        lengthCm: 10,
        fragile: false,
        declaredValueCents: -100,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Paquete 1: declaredValueCents debe ser mayor o igual a 0',
      );
    });

    it('debe acumular múltiples errores', () => {
      const pkg: IPackage = {
        weightKg: 0,
        heightCm: -10,
        widthCm: 0,
        lengthCm: -5,
        fragile: false,
        declaredValueCents: -100,
      };

      const result = validator.validate(pkg, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('validateAll', () => {
    it('debe validar lista de paquetes correcta', () => {
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
          fragile: true,
          declaredValueCents: 5000,
        },
      ];

      const result = validator.validateAll(packages);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debe rechazar lista vacía', () => {
      const result = validator.validateAll([]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La orden debe contener al menos un paquete');
    });

    it('debe rechazar lista nula', () => {
      const result = validator.validateAll(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('La orden debe contener al menos un paquete');
    });

    it('debe identificar errores en múltiples paquetes', () => {
      const packages: IPackage[] = [
        {
          weightKg: 0,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
        {
          weightKg: 3,
          heightCm: 0,
          widthCm: 15,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const result = validator.validateAll(packages);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Paquete 1: weightKg debe ser mayor que 0');
      expect(result.errors).toContain('Paquete 2: heightCm debe ser mayor que 0');
    });
  });
});
