import { Module } from '@nestjs/common';
import {
  PACKAGE_CALCULATOR,
  RATE_CALCULATOR,
  SURCHARGE_CALCULATOR,
  DISCOUNT_CALCULATOR,
  TARIFF_CALCULATOR,
  PACKAGE_VALIDATOR,
  DISCOUNT_VALIDATOR,
  INSURANCE_VALIDATOR,
  ORDER_VALIDATOR,
  ORDER_REPOSITORY,
  RECEIPT_GENERATOR,
} from '../shared/interfaces';

// Calculators
import {
  PackageCalculator,
  RateCalculator,
  SurchargeCalculator,
  DiscountCalculator,
  TariffCalculator,
} from './calculators';

// Validators
import {
  PackageValidator,
  DiscountValidator,
  InsuranceValidator,
  OrderValidator,
} from './validators';

// Repository
import { InMemoryOrderRepository } from './repositories';

// Services
import { OrderService, ReceiptGenerator } from './services';

// Controllers
import { OrderController } from './controllers';

@Module({
  controllers: [OrderController],
  providers: [
    // Calculators (SRP: cada calculador tiene una responsabilidad única)
    {
      provide: PACKAGE_CALCULATOR,
      useClass: PackageCalculator,
    },
    {
      provide: RATE_CALCULATOR,
      useClass: RateCalculator,
    },
    {
      provide: SURCHARGE_CALCULATOR,
      useClass: SurchargeCalculator,
    },
    {
      provide: DISCOUNT_CALCULATOR,
      useClass: DiscountCalculator,
    },
    {
      provide: TARIFF_CALCULATOR,
      useClass: TariffCalculator,
    },

    // Validators (ISP: interfaces pequeñas y específicas)
    {
      provide: PACKAGE_VALIDATOR,
      useClass: PackageValidator,
    },
    {
      provide: DISCOUNT_VALIDATOR,
      useClass: DiscountValidator,
    },
    {
      provide: INSURANCE_VALIDATOR,
      useClass: InsuranceValidator,
    },
    {
      provide: ORDER_VALIDATOR,
      useClass: OrderValidator,
    },

    // Repository (DIP: depende de abstracción, no de implementación concreta)
    {
      provide: ORDER_REPOSITORY,
      useClass: InMemoryOrderRepository,
    },

    // Receipt Generator
    {
      provide: RECEIPT_GENERATOR,
      useClass: ReceiptGenerator,
    },

    // Order Service
    OrderService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
