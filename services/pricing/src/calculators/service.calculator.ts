import { Injectable } from '@nestjs/common';
import { ServiceType, IServiceCalculator } from '../interfaces/pricing.interface';

@Injectable()
export class ServiceCalculator implements IServiceCalculator {
  private readonly MULTIPLIERS: Record<ServiceType, number> = {
    [ServiceType.SERVICE_UNSPECIFIED]: 1.0,
    [ServiceType.SERVICE_STANDARD]: 1.0,
    [ServiceType.SERVICE_EXPRESS]: 1.35,
    [ServiceType.SERVICE_SAME_DAY]: 1.8,
  };

  getMultiplier(serviceType: ServiceType): number {
    return this.MULTIPLIERS[serviceType] || 1.0;
  }

  calculateServiceSubtotal(baseSubtotal: number, serviceType: ServiceType): number {
    return baseSubtotal * this.getMultiplier(serviceType);
  }
}
