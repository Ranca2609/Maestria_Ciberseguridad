import { TariffCalculator } from '../../src/order/calculators/tariff.calculator';
import { PackageCalculator } from '../../src/order/calculators/package.calculator';
import { RateCalculator } from '../../src/order/calculators/rate.calculator';
import { SurchargeCalculator } from '../../src/order/calculators/surcharge.calculator';
import { DiscountCalculator } from '../../src/order/calculators/discount.calculator';
import { IPackage, IDiscount } from '../../src/shared/interfaces';
import { Zone, ServiceType, DiscountType } from '../../src/shared/enums';

describe('TariffCalculator', () => {
  let tariffCalculator: TariffCalculator;
  let packageCalculator: PackageCalculator;
  let rateCalculator: RateCalculator;
  let surchargeCalculator: SurchargeCalculator;
  let discountCalculator: DiscountCalculator;

  beforeEach(() => {
    packageCalculator = new PackageCalculator();
    rateCalculator = new RateCalculator();
    surchargeCalculator = new SurchargeCalculator();
    discountCalculator = new DiscountCalculator();

    tariffCalculator = new TariffCalculator(
      packageCalculator,
      rateCalculator,
      surchargeCalculator,
      discountCalculator,
    );
  });

  describe('calculate', () => {
    it('debe calcular tarifa básica para un paquete METRO STANDARD', () => {
      const packages: IPackage[] = [
        {
          weightKg: 10,
          heightCm: 50,
          widthCm: 40,
          lengthCm: 25,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // Volumétrico: (50*40*25)/5000 = 10 kg
      // Peso tarifable: max(10, 10) = 10 kg
      // Base: 10 * 800 = 8000 centavos
      // Servicio STANDARD: 8000 * 100 / 100 = 8000 centavos
      // Sin recargos ni descuento
      // Total: 8000 centavos = Q80.00

      expect(result.breakdown.orderBillableKg).toBe(10);
      expect(result.breakdown.ratePerKgCents).toBe(800);
      expect(result.breakdown.baseSubtotalCents).toBe(8000);
      expect(result.breakdown.serviceMultiplierPercent).toBe(100);
      expect(result.breakdown.serviceSubtotalCents).toBe(8000);
      expect(result.breakdown.totalCents).toBe(8000);
    });

    it('debe aplicar multiplicador EXPRESS (1.35)', () => {
      const packages: IPackage[] = [
        {
          weightKg: 10,
          heightCm: 50,
          widthCm: 40,
          lengthCm: 25,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.EXPRESS,
        discount,
        false,
      );

      // Base: 8000 centavos
      // EXPRESS: 8000 * 135 / 100 = 10800 centavos

      expect(result.breakdown.serviceMultiplierPercent).toBe(135);
      expect(result.breakdown.serviceSubtotalCents).toBe(10800);
      expect(result.breakdown.totalCents).toBe(10800);
    });

    it('debe aplicar multiplicador SAME_DAY (1.80)', () => {
      const packages: IPackage[] = [
        {
          weightKg: 10,
          heightCm: 50,
          widthCm: 40,
          lengthCm: 25,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.SAME_DAY,
        discount,
        false,
      );

      // Base: 8000 centavos
      // SAME_DAY: 8000 * 180 / 100 = 14400 centavos

      expect(result.breakdown.serviceMultiplierPercent).toBe(180);
      expect(result.breakdown.serviceSubtotalCents).toBe(14400);
      expect(result.breakdown.totalCents).toBe(14400);
    });

    it('debe calcular tarifa para zona INTERIOR', () => {
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

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // Volumétrico: (30*20*10)/5000 = 1.2 kg
      // Peso tarifable: max(5, 1.2) = 5 kg
      // INTERIOR: 5 * 1200 = 6000 centavos

      expect(result.breakdown.ratePerKgCents).toBe(1200);
      expect(result.breakdown.totalCents).toBe(6000);
    });

    it('debe calcular tarifa para zona FRONTERA', () => {
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

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.FRONTERA,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // FRONTERA: 5 * 1600 = 8000 centavos

      expect(result.breakdown.ratePerKgCents).toBe(1600);
      expect(result.breakdown.totalCents).toBe(8000);
    });

    it('debe calcular recargo por paquete frágil', () => {
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

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // Base: 5 * 800 = 4000
      // Frágil: +700 centavos
      // Total: 4700 centavos

      expect(result.breakdown.fragileSurchargeCents).toBe(700);
      expect(result.breakdown.totalCents).toBe(4700);
    });

    it('debe calcular recargo por seguro', () => {
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

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        true,
      );

      // Base: 5 * 800 = 4000
      // Seguro: 2.5% de 100000 = 2500 centavos
      // Total: 6500 centavos

      expect(result.breakdown.insuranceSurchargeCents).toBe(2500);
      expect(result.breakdown.totalCents).toBe(6500);
    });

    it('debe aplicar descuento PERCENT', () => {
      const packages: IPackage[] = [
        {
          weightKg: 10,
          heightCm: 50,
          widthCm: 40,
          lengthCm: 25,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const discount: IDiscount = { type: DiscountType.PERCENT, value: 20 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // Base: 8000 centavos
      // Descuento: 20% de 8000 = 1600
      // Total: 6400 centavos

      expect(result.breakdown.discountAmountCents).toBe(1600);
      expect(result.breakdown.totalCents).toBe(6400);
    });

    it('debe aplicar descuento FIXED', () => {
      const packages: IPackage[] = [
        {
          weightKg: 10,
          heightCm: 50,
          widthCm: 40,
          lengthCm: 25,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const discount: IDiscount = { type: DiscountType.FIXED, value: 1000 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // Base: 8000 centavos
      // Descuento: 1000 centavos
      // Total: 7000 centavos

      expect(result.breakdown.discountAmountCents).toBe(1000);
      expect(result.breakdown.totalCents).toBe(7000);
    });

    it('debe truncar a 0 si descuento FIXED excede subtotal', () => {
      const packages: IPackage[] = [
        {
          weightKg: 1,
          heightCm: 10,
          widthCm: 10,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];

      const discount: IDiscount = { type: DiscountType.FIXED, value: 100000 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        false,
      );

      expect(result.breakdown.totalCents).toBe(0);
    });

    it('debe acumular peso tarifable de múltiples paquetes', () => {
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

      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.METRO,
        ServiceType.STANDARD,
        discount,
        false,
      );

      // Paquete 1: max(5, 1.2) = 5 kg
      // Paquete 2: max(3, 0.6) = 3 kg
      // Total: 8 kg
      // Base: 8 * 800 = 6400 centavos

      expect(result.breakdown.orderBillableKg).toBe(8);
      expect(result.breakdown.totalCents).toBe(6400);
    });

    it('debe calcular caso complejo con todos los elementos', () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 50,
          widthCm: 40,
          lengthCm: 30, // Volumétrico: 12 kg (mayor que 5)
          fragile: true,
          declaredValueCents: 50000, // Q500.00
        },
        {
          weightKg: 8,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10, // Volumétrico: 1.2 kg (menor que 8)
          fragile: false,
          declaredValueCents: 30000, // Q300.00
        },
      ];

      const discount: IDiscount = { type: DiscountType.PERCENT, value: 10 };

      const result = tariffCalculator.calculate(
        packages,
        Zone.INTERIOR,
        ServiceType.EXPRESS,
        discount,
        true,
      );

      // Peso tarifable: 12 + 8 = 20 kg
      // Base: 20 * 1200 = 24000 centavos
      // EXPRESS: 24000 * 1.35 = 32400 centavos
      // Frágil: 1 * 700 = 700 centavos
      // Seguro: 2.5% de 80000 = 2000 centavos
      // Subtotal con recargos: 32400 + 700 + 2000 = 35100 centavos
      // Descuento 10%: 3510 centavos
      // Total: 31590 centavos

      expect(result.breakdown.orderBillableKg).toBe(20);
      expect(result.breakdown.baseSubtotalCents).toBe(24000);
      expect(result.breakdown.serviceSubtotalCents).toBe(32400);
      expect(result.breakdown.fragileSurchargeCents).toBe(700);
      expect(result.breakdown.insuranceSurchargeCents).toBe(2000);
      expect(result.breakdown.subtotalWithSurchargesCents).toBe(35100);
      expect(result.breakdown.discountAmountCents).toBe(3510);
      expect(result.breakdown.totalCents).toBe(31590);
    });
  });
});
