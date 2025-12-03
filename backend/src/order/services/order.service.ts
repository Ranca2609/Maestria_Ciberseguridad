import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IOrderRepository,
  IOrderValidator,
  ITariffCalculator,
  IReceiptGenerator,
  IOrder,
  IOrderSummary,
  IReceipt,
  IPackage,
  IDiscount,
  ORDER_REPOSITORY,
  ORDER_VALIDATOR,
  TARIFF_CALCULATOR,
  RECEIPT_GENERATOR,
} from '../../shared/interfaces';
import { Zone, ServiceType, OrderStatus, DiscountType } from '../../shared/enums';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(ORDER_VALIDATOR)
    private readonly orderValidator: IOrderValidator,
    @Inject(TARIFF_CALCULATOR)
    private readonly tariffCalculator: ITariffCalculator,
    @Inject(RECEIPT_GENERATOR)
    private readonly receiptGenerator: IReceiptGenerator,
  ) {}

  /**
   * Crea una nueva orden.
   */
  async createOrder(
    originZone: Zone,
    destinationZone: Zone,
    serviceType: ServiceType,
    packages: IPackage[],
    discount: IDiscount | null,
    insuranceEnabled: boolean,
  ): Promise<IOrder> {
    // Normalizar descuento
    const normalizedDiscount: IDiscount = discount || {
      type: DiscountType.NONE,
      value: 0,
    };

    // Validar entrada
    const validationResult = this.orderValidator.validateCreateOrder(
      originZone,
      destinationZone,
      serviceType,
      packages,
      normalizedDiscount,
      insuranceEnabled,
    );

    if (!validationResult.isValid) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: validationResult.errors.join('; '),
      });
    }

    // Calcular tarifas
    const { packagesWithCalcs, breakdown } = this.tariffCalculator.calculate(
      packages,
      destinationZone,
      serviceType,
      normalizedDiscount,
      insuranceEnabled,
    );

    // Crear orden
    const order: IOrder = {
      orderId: uuidv4(),
      createdAt: new Date(),
      originZone,
      destinationZone,
      serviceType,
      packages: packagesWithCalcs,
      discount: normalizedDiscount,
      insuranceEnabled,
      status: OrderStatus.ACTIVE,
      breakdown,
    };

    // Guardar y retornar
    return this.orderRepository.save(order);
  }

  /**
   * Lista todas las órdenes con paginación.
   */
  async listOrders(
    pageSize: number = 10,
    pageToken?: string,
  ): Promise<{ orders: IOrderSummary[]; nextPageToken: string; totalCount: number }> {
    // Aplicar límites a pageSize
    const effectivePageSize = Math.min(Math.max(1, pageSize || 10), 100);

    const allOrders = await this.orderRepository.findAll();

    // Ordenar por fecha de creación descendente
    allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calcular offset basado en pageToken
    let offset = 0;
    if (pageToken) {
      offset = parseInt(pageToken, 10) || 0;
    }

    // Obtener página actual
    const paginatedOrders = allOrders.slice(offset, offset + effectivePageSize);

    // Mapear a resumen
    const orderSummaries: IOrderSummary[] = paginatedOrders.map((order) => ({
      orderId: order.orderId,
      destinationZone: order.destinationZone,
      serviceType: order.serviceType,
      status: order.status,
      totalCents: order.breakdown.totalCents,
      createdAt: order.createdAt,
    }));

    // Calcular nextPageToken
    const nextOffset = offset + effectivePageSize;
    const nextPageToken = nextOffset < allOrders.length ? nextOffset.toString() : '';

    return {
      orders: orderSummaries,
      nextPageToken,
      totalCount: allOrders.length,
    };
  }

  /**
   * Obtiene una orden por su ID.
   */
  async getOrder(orderId: string): Promise<IOrder> {
    if (!orderId) {
      throw new RpcException({
        code: GrpcStatus.INVALID_ARGUMENT,
        message: 'orderId es requerido',
      });
    }

    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new RpcException({
        code: GrpcStatus.NOT_FOUND,
        message: `Orden con ID ${orderId} no encontrada`,
      });
    }

    return order;
  }

  /**
   * Cancela una orden.
   */
  async cancelOrder(orderId: string): Promise<IOrder> {
    const order = await this.getOrder(orderId);

    if (order.status === OrderStatus.CANCELLED) {
      throw new RpcException({
        code: GrpcStatus.FAILED_PRECONDITION,
        message: `La orden ${orderId} ya está cancelada`,
      });
    }

    // Actualizar estado
    order.status = OrderStatus.CANCELLED;

    return this.orderRepository.update(order);
  }

  /**
   * Genera un recibo para una orden.
   */
  async getReceipt(orderId: string): Promise<IReceipt> {
    const order = await this.getOrder(orderId);
    return this.receiptGenerator.generate(order);
  }
}
