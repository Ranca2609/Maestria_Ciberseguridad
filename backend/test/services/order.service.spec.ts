import { OrderService } from '../../src/order/services/order.service';
import { InMemoryOrderRepository } from '../../src/order/repositories/in-memory-order.repository';
import { OrderValidator } from '../../src/order/validators/order.validator';
import { PackageValidator } from '../../src/order/validators/package.validator';
import { DiscountValidator } from '../../src/order/validators/discount.validator';
import { InsuranceValidator } from '../../src/order/validators/insurance.validator';
import { TariffCalculator } from '../../src/order/calculators/tariff.calculator';
import { PackageCalculator } from '../../src/order/calculators/package.calculator';
import { RateCalculator } from '../../src/order/calculators/rate.calculator';
import { SurchargeCalculator } from '../../src/order/calculators/surcharge.calculator';
import { DiscountCalculator } from '../../src/order/calculators/discount.calculator';
import { ReceiptGenerator } from '../../src/order/services/receipt.generator';
import { Zone, ServiceType, DiscountType, OrderStatus } from '../../src/shared/enums';
import { IPackage, IDiscount } from '../../src/shared/interfaces';
import { RpcException } from '@nestjs/microservices';

describe('OrderService', () => {
  let orderService: OrderService;
  let orderRepository: InMemoryOrderRepository;

  beforeEach(() => {
    // Crear instancias de todos los componentes
    const packageCalculator = new PackageCalculator();
    const rateCalculator = new RateCalculator();
    const surchargeCalculator = new SurchargeCalculator();
    const discountCalculator = new DiscountCalculator();

    const tariffCalculator = new TariffCalculator(
      packageCalculator,
      rateCalculator,
      surchargeCalculator,
      discountCalculator,
    );

    const packageValidator = new PackageValidator();
    const discountValidator = new DiscountValidator();
    const insuranceValidator = new InsuranceValidator();

    const orderValidator = new OrderValidator(
      packageValidator,
      discountValidator,
      insuranceValidator,
    );

    orderRepository = new InMemoryOrderRepository();
    const receiptGenerator = new ReceiptGenerator();

    orderService = new OrderService(
      orderRepository,
      orderValidator,
      tariffCalculator,
      receiptGenerator,
    );
  });

  describe('createOrder', () => {
    it('debe crear una orden válida', async () => {
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

      const order = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      expect(order.orderId).toBeDefined();
      expect(order.status).toBe(OrderStatus.ACTIVE);
      expect(order.originZone).toBe(Zone.METRO);
      expect(order.destinationZone).toBe(Zone.INTERIOR);
      expect(order.serviceType).toBe(ServiceType.STANDARD);
      expect(order.packages).toHaveLength(1);
      expect(order.breakdown.totalCents).toBeGreaterThan(0);
    });

    it('debe rechazar orden con paquete inválido', async () => {
      const packages: IPackage[] = [
        {
          weightKg: 0, // Inválido
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: false,
          declaredValueCents: 0,
        },
      ];
      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      await expect(
        orderService.createOrder(
          Zone.METRO,
          Zone.INTERIOR,
          ServiceType.STANDARD,
          packages,
          discount,
          false,
        ),
      ).rejects.toThrow(RpcException);
    });

    it('debe rechazar orden con seguro activo y valor declarado 0', async () => {
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

      await expect(
        orderService.createOrder(
          Zone.METRO,
          Zone.INTERIOR,
          ServiceType.STANDARD,
          packages,
          discount,
          true, // Seguro activo
        ),
      ).rejects.toThrow(RpcException);
    });

    it('debe rechazar orden con descuento PERCENT > 35%', async () => {
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
      const discount: IDiscount = { type: DiscountType.PERCENT, value: 40 };

      await expect(
        orderService.createOrder(
          Zone.METRO,
          Zone.INTERIOR,
          ServiceType.STANDARD,
          packages,
          discount,
          false,
        ),
      ).rejects.toThrow(RpcException);
    });

    it('debe rechazar orden sin paquetes', async () => {
      const discount: IDiscount = { type: DiscountType.NONE, value: 0 };

      await expect(
        orderService.createOrder(
          Zone.METRO,
          Zone.INTERIOR,
          ServiceType.STANDARD,
          [],
          discount,
          false,
        ),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('getOrder', () => {
    it('debe obtener una orden existente', async () => {
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

      const createdOrder = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      const retrievedOrder = await orderService.getOrder(createdOrder.orderId);
      expect(retrievedOrder.orderId).toBe(createdOrder.orderId);
    });

    it('debe lanzar error para orderId inexistente', async () => {
      await expect(
        orderService.getOrder('non-existent-id'),
      ).rejects.toThrow(RpcException);
    });

    it('debe lanzar error para orderId vacío', async () => {
      await expect(orderService.getOrder('')).rejects.toThrow(RpcException);
    });
  });

  describe('cancelOrder', () => {
    it('debe cancelar una orden activa', async () => {
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

      const order = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      const cancelledOrder = await orderService.cancelOrder(order.orderId);
      expect(cancelledOrder.status).toBe(OrderStatus.CANCELLED);
    });

    it('debe lanzar error al cancelar una orden ya cancelada (doble cancelación)', async () => {
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

      const order = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      await orderService.cancelOrder(order.orderId);

      await expect(
        orderService.cancelOrder(order.orderId),
      ).rejects.toThrow(RpcException);
    });

    it('debe lanzar error para orderId inexistente', async () => {
      await expect(
        orderService.cancelOrder('non-existent-id'),
      ).rejects.toThrow(RpcException);
    });

    it('debe mantener el total y desglose después de cancelar', async () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: true,
          declaredValueCents: 10000,
        },
      ];
      const discount: IDiscount = { type: DiscountType.PERCENT, value: 10 };

      const order = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.EXPRESS,
        packages,
        discount,
        true,
      );

      const originalTotal = order.breakdown.totalCents;

      const cancelledOrder = await orderService.cancelOrder(order.orderId);
      expect(cancelledOrder.breakdown.totalCents).toBe(originalTotal);
    });
  });

  describe('listOrders', () => {
    it('debe listar todas las órdenes', async () => {
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

      await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      await orderService.createOrder(
        Zone.METRO,
        Zone.FRONTERA,
        ServiceType.EXPRESS,
        packages,
        discount,
        false,
      );

      const result = await orderService.listOrders();
      expect(result.orders).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('debe incluir órdenes ACTIVE y CANCELLED', async () => {
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

      const order1 = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      await orderService.createOrder(
        Zone.METRO,
        Zone.FRONTERA,
        ServiceType.EXPRESS,
        packages,
        discount,
        false,
      );

      await orderService.cancelOrder(order1.orderId);

      const result = await orderService.listOrders();
      expect(result.orders).toHaveLength(2);

      const statuses = result.orders.map((o) => o.status);
      expect(statuses).toContain(OrderStatus.ACTIVE);
      expect(statuses).toContain(OrderStatus.CANCELLED);
    });

    it('debe retornar lista vacía si no hay órdenes', async () => {
      const result = await orderService.listOrders();
      expect(result.orders).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('debe aplicar paginación correctamente', async () => {
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

      // Crear 5 órdenes
      for (let i = 0; i < 5; i++) {
        await orderService.createOrder(
          Zone.METRO,
          Zone.INTERIOR,
          ServiceType.STANDARD,
          packages,
          discount,
          false,
        );
      }

      const page1 = await orderService.listOrders(2);
      expect(page1.orders).toHaveLength(2);
      expect(page1.nextPageToken).toBe('2');
      expect(page1.totalCount).toBe(5);

      const page2 = await orderService.listOrders(2, '2');
      expect(page2.orders).toHaveLength(2);
      expect(page2.nextPageToken).toBe('4');

      const page3 = await orderService.listOrders(2, '4');
      expect(page3.orders).toHaveLength(1);
      expect(page3.nextPageToken).toBe('');
    });
  });

  describe('getReceipt', () => {
    it('debe generar un recibo para una orden', async () => {
      const packages: IPackage[] = [
        {
          weightKg: 5,
          heightCm: 30,
          widthCm: 20,
          lengthCm: 10,
          fragile: true,
          declaredValueCents: 10000,
        },
      ];
      const discount: IDiscount = { type: DiscountType.PERCENT, value: 10 };

      const order = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.EXPRESS,
        packages,
        discount,
        true,
      );

      const receipt = await orderService.getReceipt(order.orderId);

      expect(receipt.receiptId).toBeDefined();
      expect(receipt.orderId).toBe(order.orderId);
      expect(receipt.generatedAt).toBeDefined();
      expect(receipt.originZone).toBe(Zone.METRO);
      expect(receipt.destinationZone).toBe(Zone.INTERIOR);
      expect(receipt.serviceType).toBe(ServiceType.EXPRESS);
      expect(receipt.orderStatus).toBe(OrderStatus.ACTIVE);
      expect(receipt.packages).toHaveLength(1);
      expect(receipt.breakdown.totalCents).toBe(order.breakdown.totalCents);
      expect(receipt.formattedTotal).toMatch(/^Q \d+\.\d{2}$/);
    });

    it('debe generar recibo para orden cancelada con datos congelados', async () => {
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

      const order = await orderService.createOrder(
        Zone.METRO,
        Zone.INTERIOR,
        ServiceType.STANDARD,
        packages,
        discount,
        false,
      );

      const originalTotal = order.breakdown.totalCents;
      await orderService.cancelOrder(order.orderId);

      const receipt = await orderService.getReceipt(order.orderId);

      expect(receipt.orderStatus).toBe(OrderStatus.CANCELLED);
      expect(receipt.breakdown.totalCents).toBe(originalTotal);
    });

    it('debe lanzar error para orderId inexistente', async () => {
      await expect(
        orderService.getReceipt('non-existent-id'),
      ).rejects.toThrow(RpcException);
    });
  });
});
