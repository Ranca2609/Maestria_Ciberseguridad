import { Test, TestingModule } from '@nestjs/testing';
import {
  PricingCalculator,
  PackageCalculator,
  RateCalculator,
  ServiceCalculator,
  SurchargeCalculator,
  DiscountCalculator,
} from '../src/calculators';
import {
  Zone,
  ServiceType,
  DiscountType,
  ICalculatePriceRequest,
} from '../src/interfaces/pricing.interface';

describe('PricingCalculator', () => {
  let calculator: PricingCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingCalculator,
        PackageCalculator,
        RateCalculator,
        ServiceCalculator,
        SurchargeCalculator,
        DiscountCalculator,
      ],
    }).compile();

    calculator = module.get<PricingCalculator>(PricingCalculator);
  });

  describe('calculate', () => {
    it('debe calcular correctamente una orden simple METRO + STANDARD', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 5,
            heightCm: 30,
            widthCm: 20,
            lengthCm: 15,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Peso volumétrico: (30*20*15)/5000 = 1.8 kg
      // Peso tarifable: max(5, 1.8) = 5 kg
      // Base: 5 * 8 = 40 Q
      // Servicio: 40 * 1.0 = 40 Q
      // Total: 40 Q
      expect(result.breakdown.orderBillableKg).toBe(5);
      expect(result.breakdown.baseSubtotal).toBe(40);
      expect(result.breakdown.serviceSubtotal).toBe(40);
      expect(result.breakdown.total).toBe(40);
    });

    it('debe aplicar multiplicador EXPRESS correctamente', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_INTERIOR,
        serviceType: ServiceType.SERVICE_EXPRESS,
        packages: [
          {
            weightKg: 10,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Peso volumétrico: (10*10*10)/5000 = 0.2 kg
      // Peso tarifable: max(10, 0.2) = 10 kg
      // Base: 10 * 12 = 120 Q (INTERIOR)
      // Servicio: 120 * 1.35 = 162 Q
      expect(result.breakdown.orderBillableKg).toBe(10);
      expect(result.breakdown.baseSubtotal).toBe(120);
      expect(result.breakdown.serviceSubtotal).toBe(162);
      expect(result.breakdown.total).toBe(162);
    });

    it('debe aplicar multiplicador SAME_DAY correctamente', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_FRONTERA,
        serviceType: ServiceType.SERVICE_SAME_DAY,
        packages: [
          {
            weightKg: 5,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Base: 5 * 16 = 80 Q (FRONTERA)
      // Servicio: 80 * 1.8 = 144 Q
      expect(result.breakdown.baseSubtotal).toBe(80);
      expect(result.breakdown.serviceSubtotal).toBe(144);
      expect(result.breakdown.total).toBe(144);
    });

    it('debe calcular recargo por frágil correctamente', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 2,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: true,
            declaredValueQ: 0,
          },
          {
            weightKg: 3,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: true,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // 2 paquetes frágiles * 7 Q = 14 Q recargo
      expect(result.breakdown.fragileSurcharge).toBe(14);
      expect(result.breakdown.fragilePackagesCount).toBe(2);
    });

    it('debe calcular recargo de seguro correctamente', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 2,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 1000,
          },
        ],
        insuranceEnabled: true,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Seguro: 1000 * 0.025 = 25 Q
      expect(result.breakdown.insuranceSurcharge).toBe(25);
      expect(result.breakdown.declaredValueTotal).toBe(1000);
    });

    it('debe rechazar seguro sin valor declarado', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 2,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: true,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('valor declarado');
    });

    it('debe aplicar descuento porcentual correctamente', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 10,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        discount: {
          type: DiscountType.DISCOUNT_PERCENT,
          value: 10,
        },
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Base: 10 * 8 = 80 Q
      // Descuento: 80 * 0.10 = 8 Q
      // Total: 80 - 8 = 72 Q
      expect(result.breakdown.subtotalWithSurcharges).toBe(80);
      expect(result.breakdown.discountAmount).toBe(8);
      expect(result.breakdown.total).toBe(72);
    });

    it('debe rechazar descuento porcentual mayor a 35%', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 10,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        discount: {
          type: DiscountType.DISCOUNT_PERCENT,
          value: 40,
        },
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('35');
    });

    it('debe aplicar descuento fijo correctamente', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 10,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        discount: {
          type: DiscountType.DISCOUNT_FIXED,
          value: 15,
        },
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Base: 80 Q
      // Descuento: 15 Q fijo
      // Total: 80 - 15 = 65 Q
      expect(result.breakdown.discountAmount).toBe(15);
      expect(result.breakdown.total).toBe(65);
    });

    it('debe limitar total a 0 si descuento fijo excede subtotal', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 1,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        discount: {
          type: DiscountType.DISCOUNT_FIXED,
          value: 100,
        },
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Base: 1 * 8 = 8 Q
      // Descuento: min(100, 8) = 8 Q
      // Total: max(0, 8 - 8) = 0 Q
      expect(result.breakdown.total).toBe(0);
    });

    it('debe rechazar paquetes con peso <= 0', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 0,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('peso');
    });

    it('debe rechazar paquetes con dimensiones <= 0', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 5,
            heightCm: 0,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('dimensiones');
    });

    it('debe usar peso volumétrico cuando es mayor al peso real', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 1,
            heightCm: 50,
            widthCm: 50,
            lengthCm: 50,
            fragile: false,
            declaredValueQ: 0,
          },
        ],
        insuranceEnabled: false,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Peso volumétrico: (50*50*50)/5000 = 25 kg
      // Peso tarifable: max(1, 25) = 25 kg
      expect(result.breakdown.orderBillableKg).toBe(25);
      expect(result.breakdown.total).toBe(200); // 25 * 8
    });

    it('debe calcular correctamente múltiples paquetes', () => {
      const request: ICalculatePriceRequest = {
        originZone: Zone.ZONE_METRO,
        destinationZone: Zone.ZONE_METRO,
        serviceType: ServiceType.SERVICE_STANDARD,
        packages: [
          {
            weightKg: 5,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 0,
          },
          {
            weightKg: 3,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: true,
            declaredValueQ: 500,
          },
          {
            weightKg: 2,
            heightCm: 10,
            widthCm: 10,
            lengthCm: 10,
            fragile: false,
            declaredValueQ: 500,
          },
        ],
        discount: {
          type: DiscountType.DISCOUNT_PERCENT,
          value: 10,
        },
        insuranceEnabled: true,
      };

      const result = calculator.calculate(request);

      expect(result.valid).toBe(true);
      // Peso tarifable: 5 + 3 + 2 = 10 kg
      // Base: 10 * 8 = 80 Q
      // Frágil: 1 * 7 = 7 Q
      // Seguro: 1000 * 0.025 = 25 Q
      // Subtotal: 80 + 7 + 25 = 112 Q
      // Descuento: 112 * 0.10 = 11.2 Q
      // Total: 112 - 11.2 = 100.8 Q
      expect(result.breakdown.orderBillableKg).toBe(10);
      expect(result.breakdown.baseSubtotal).toBe(80);
      expect(result.breakdown.fragileSurcharge).toBe(7);
      expect(result.breakdown.insuranceSurcharge).toBe(25);
      expect(result.breakdown.subtotalWithSurcharges).toBe(112);
      expect(result.breakdown.discountAmount).toBe(11.2);
      expect(result.breakdown.total).toBe(100.8);
    });
  });
});
