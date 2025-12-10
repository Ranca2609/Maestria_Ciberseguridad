import { Injectable } from '@nestjs/common';
import { Zone, IRateCalculator } from '../interfaces/pricing.interface';

@Injectable()
export class RateCalculator implements IRateCalculator {
  private readonly RATES: Record<Zone, number> = {
    [Zone.ZONE_UNSPECIFIED]: 0,
    [Zone.ZONE_METRO]: 8,
    [Zone.ZONE_INTERIOR]: 12,
    [Zone.ZONE_FRONTERA]: 16,
  };

  getRatePerKg(zone: Zone): number {
    return this.RATES[zone] || 0;
  }

  calculateBaseSubtotal(billableKg: number, zone: Zone): number {
    return billableKg * this.getRatePerKg(zone);
  }
}
