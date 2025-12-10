import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GatewayService } from '../services';
import {
  CreateOrderDto,
  CreateOrderResponseDto,
  ListOrdersResponseDto,
  OrderDetailDto,
  CancelOrderResponseDto,
  ReceiptDto,
  ErrorResponseDto,
  ListOrdersQueryDto,
} from '../dto';

@ApiTags('Orders')
@Controller('v1/orders')
export class OrderController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva orden' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Clave de idempotencia para evitar duplicados',
    required: false,
  })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente', type: CreateOrderResponseDto })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Conflicto de idempotencia', type: ErrorResponseDto })
  @ApiResponse({ status: 503, description: 'Servicio no disponible', type: ErrorResponseDto })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<CreateOrderResponseDto> {
    return this.gatewayService.createOrder(createOrderDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Tamaño de página (default: 20, max: 100)' })
  @ApiResponse({ status: 200, description: 'Lista de órdenes', type: ListOrdersResponseDto })
  async listOrders(
    @Query() query: ListOrdersQueryDto,
  ): Promise<ListOrdersResponseDto> {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    return this.gatewayService.listOrders(page, pageSize);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Obtener detalle de una orden' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Detalle de la orden', type: OrderDetailDto })
  @ApiResponse({ status: 404, description: 'Orden no encontrada', type: ErrorResponseDto })
  async getOrder(@Param('orderId') orderId: string): Promise<OrderDetailDto> {
    return this.gatewayService.getOrder(orderId);
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una orden' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Orden cancelada exitosamente', type: CancelOrderResponseDto })
  @ApiResponse({ status: 404, description: 'Orden no encontrada', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'La orden ya está cancelada', type: ErrorResponseDto })
  async cancelOrder(@Param('orderId') orderId: string): Promise<CancelOrderResponseDto> {
    return this.gatewayService.cancelOrder(orderId);
  }

  @Get(':orderId/receipt')
  @ApiOperation({ summary: 'Obtener recibo de una orden' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  @ApiResponse({ status: 200, description: 'Recibo generado', type: ReceiptDto })
  @ApiResponse({ status: 404, description: 'Orden no encontrada', type: ErrorResponseDto })
  async getReceipt(@Param('orderId') orderId: string): Promise<ReceiptDto> {
    return this.gatewayService.getReceipt(orderId);
  }
}
