import { Injectable } from '@nestjs/common';
import { IRateCalculator } from '../../shared/interfaces';
import { Zone, ZONE_RATES, ServiceType, SERVICE_MULTIPLIERS } from '../../shared/enums';

@Injectable()
export class RateCalculator implements IRateCalculator {
  /**
   * Obtiene la tarifa por kg según la zona de destino (en centavos).
   * - METRO: 800 centavos (Q8.00)
   * - INTERIOR: 1200 centavos (Q12.00)
   * - FRONTERA: 1600 centavos (Q16.00)
   */
  getRateForZone(zone: Zone): number {
    return ZONE_RATES[zone] || 0;
  }

  /**
   * Obtiene el multiplicador por tipo de servicio (en porcentaje).
   * - STANDARD: 100 (1.00)
   * - EXPRESS: 135 (1.35)
   * - SAME_DAY: 180 (1.80)
   */
  getMultiplierForService(serviceType: ServiceType): number {
    return SERVICE_MULTIPLIERS[serviceType] || 100;
  }
}
