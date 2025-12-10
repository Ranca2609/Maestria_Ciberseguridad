import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import {
  PackageCalculator,
  RateCalculator,
  ServiceCalculator,
  SurchargeCalculator,
  DiscountCalculator,
  PricingCalculator,
} from './calculators';

@Module({
  controllers: [PricingController],
  providers: [
    PackageCalculator,
    RateCalculator,
    ServiceCalculator,
    SurchargeCalculator,
    DiscountCalculator,
    PricingCalculator,
  ],
  exports: [PricingCalculator],
})
export class PricingModule {}
