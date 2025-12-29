import { IsString, IsNumber, IsArray, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertCurrencyDto {
  @ApiProperty({
    description: 'Moneda de origen',
    example: 'GTQ',
    enum: ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'],
  })
  @IsString()
  from_currency: string;

  @ApiProperty({
    description: 'Moneda de destino',
    example: 'USD',
    enum: ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'],
  })
  @IsString()
  to_currency: string;

  @ApiProperty({
    description: 'Monto a convertir',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class GetExchangeRateDto {
  @ApiProperty({
    description: 'Moneda de origen',
    example: 'GTQ',
    enum: ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'],
  })
  @IsString()
  from_currency: string;

  @ApiProperty({
    description: 'Moneda de destino',
    example: 'USD',
    enum: ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'],
  })
  @IsString()
  to_currency: string;
}

export class GetRatesDto {
  @ApiProperty({
    description: 'Moneda base',
    example: 'GTQ',
    enum: ['GTQ', 'USD', 'EUR', 'GBP', 'MXN'],
  })
  @IsString()
  base_currency: string;

  @ApiProperty({
    description: 'Lista de monedas objetivo',
    example: ['USD', 'EUR', 'GBP', 'MXN'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  target_currencies: string[];
}
