import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  ArrayMinSize,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Zone {
  METRO = 'METRO',
  INTERIOR = 'INTERIOR',
  FRONTERA = 'FRONTERA',
}

export enum ServiceType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  SAME_DAY = 'SAME_DAY',
}

export enum DiscountType {
  NONE = 'NONE',
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum OrderStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}

export class PackageDto {
  @ApiProperty({ minimum: 0.01, example: 5.5 })
  @IsNumber()
  @Min(0.01)
  weightKg: number;

  @ApiProperty({ minimum: 0.01, example: 30 })
  @IsNumber()
  @Min(0.01)
  heightCm: number;

  @ApiProperty({ minimum: 0.01, example: 20 })
  @IsNumber()
  @Min(0.01)
  widthCm: number;

  @ApiProperty({ minimum: 0.01, example: 15 })
  @IsNumber()
  @Min(0.01)
  lengthCm: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  fragile: boolean;

  @ApiProperty({ minimum: 0, example: 500 })
  @IsNumber()
  @Min(0)
  declaredValueQ: number;
}

export class DiscountDto {
  @ApiProperty({ enum: DiscountType, example: DiscountType.NONE })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ minimum: 0, example: 10 })
  @IsNumber()
  @Min(0)
  value: number;
}

export class CreateOrderDto {
  @ApiProperty({ enum: Zone, example: Zone.METRO })
  @IsEnum(Zone)
  originZone: Zone;

  @ApiProperty({ enum: Zone, example: Zone.INTERIOR })
  @IsEnum(Zone)
  destinationZone: Zone;

  @ApiProperty({ enum: ServiceType, example: ServiceType.STANDARD })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ type: [PackageDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages: PackageDto[];

  @ApiPropertyOptional({ type: DiscountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiscountDto)
  discount?: DiscountDto;

  @ApiProperty({ example: false })
  @IsBoolean()
  insuranceEnabled: boolean;
}

export class BreakdownDto {
  @ApiProperty()
  orderBillableKg: number;

  @ApiProperty()
  baseSubtotal: number;

  @ApiProperty()
  serviceSubtotal: number;

  @ApiProperty()
  fragileSurcharge: number;

  @ApiProperty()
  insuranceSurcharge: number;

  @ApiProperty()
  subtotalWithSurcharges: number;

  @ApiProperty()
  discountAmount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  ratePerKg: number;

  @ApiProperty()
  serviceMultiplier: number;

  @ApiProperty()
  fragilePackagesCount: number;

  @ApiProperty()
  declaredValueTotal: number;
}

export class CreateOrderResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: BreakdownDto })
  breakdown: BreakdownDto;

  @ApiProperty()
  total: number;
}

export class OrderSummaryDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: Zone })
  destinationZone: Zone;

  @ApiProperty({ enum: ServiceType })
  serviceType: ServiceType;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  total: number;

  @ApiProperty()
  createdAt: string;
}

export class ListOrdersResponseDto {
  @ApiProperty({ type: [OrderSummaryDto] })
  orders: OrderSummaryDto[];

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;
}

export class OrderDetailDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ enum: Zone })
  originZone: Zone;

  @ApiProperty({ enum: Zone })
  destinationZone: Zone;

  @ApiProperty({ enum: ServiceType })
  serviceType: ServiceType;

  @ApiProperty({ type: [PackageDto] })
  packages: PackageDto[];

  @ApiPropertyOptional({ type: DiscountDto })
  discount?: DiscountDto;

  @ApiProperty()
  insuranceEnabled: boolean;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ type: BreakdownDto })
  breakdown: BreakdownDto;

  @ApiProperty()
  total: number;
}

export class CancelOrderResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  cancelledAt: string;
}

export class ReceiptLineDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;
}

export class ReceiptDto {
  @ApiProperty()
  receiptId: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  generatedAt: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  originZone: string;

  @ApiProperty()
  destinationZone: string;

  @ApiProperty()
  serviceType: string;

  @ApiProperty()
  packagesCount: number;

  @ApiProperty({ type: [ReceiptLineDto] })
  lines: ReceiptLineDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  insuranceEnabled: boolean;

  @ApiProperty()
  declaredValue: number;
}

export class ErrorResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  error: string;

  @ApiPropertyOptional({ type: [String] })
  details?: string[];
}

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20;
}
