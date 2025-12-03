import { RateCalculator } from '../../src/order/calculators/rate.calculator';
import { Zone, ServiceType } from '../../src/shared/enums';

describe('RateCalculator', () => {
  let calculator: RateCalculator;

  beforeEach(() => {
    calculator = new RateCalculator();
  });

  describe('getRateForZone', () => {
    it('debe retornar 800 centavos (Q8.00) para zona METRO', () => {
      const result = calculator.getRateForZone(Zone.METRO);
      expect(result).toBe(800);
    });

    it('debe retornar 1200 centavos (Q12.00) para zona INTERIOR', () => {
      const result = calculator.getRateForZone(Zone.INTERIOR);
      expect(result).toBe(1200);
    });

    it('debe retornar 1600 centavos (Q16.00) para zona FRONTERA', () => {
      const result = calculator.getRateForZone(Zone.FRONTERA);
      expect(result).toBe(1600);
    });

    it('debe retornar 0 para zona no especificada', () => {
      const result = calculator.getRateForZone(Zone.ZONE_UNSPECIFIED);
      expect(result).toBe(0);
    });
  });

  describe('getMultiplierForService', () => {
    it('debe retornar 100 (1.00) para servicio STANDARD', () => {
      const result = calculator.getMultiplierForService(ServiceType.STANDARD);
      expect(result).toBe(100);
    });

    it('debe retornar 135 (1.35) para servicio EXPRESS', () => {
      const result = calculator.getMultiplierForService(ServiceType.EXPRESS);
      expect(result).toBe(135);
    });

    it('debe retornar 180 (1.80) para servicio SAME_DAY', () => {
      const result = calculator.getMultiplierForService(ServiceType.SAME_DAY);
      expect(result).toBe(180);
    });

    it('debe retornar 100 para servicio no especificado', () => {
      const result = calculator.getMultiplierForService(ServiceType.SERVICE_TYPE_UNSPECIFIED);
      expect(result).toBe(100);
    });
  });
});
