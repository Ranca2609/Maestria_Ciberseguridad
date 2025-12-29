import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FxService } from '../services/fx.service';
import { ConvertCurrencyDto, GetExchangeRateDto, GetRatesDto } from '../dto/fx.dto';

@ApiTags('fx')
@Controller('v1/fx')
export class FxController {
  private readonly logger = new Logger(FxController.name);

  constructor(private readonly fxService: FxService) {}

  @Post('convert')
  @ApiOperation({ summary: 'Convertir moneda' })
  @ApiResponse({ status: 200, description: 'Conversión exitosa' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 500, description: 'Error del servidor' })
  async convertCurrency(@Body() dto: ConvertCurrencyDto) {
    this.logger.log(
      `Convert request: ${dto.amount} ${dto.from_currency} → ${dto.to_currency}`,
    );

    try {
      const result = await this.fxService.convert(
        dto.from_currency,
        dto.to_currency,
        dto.amount,
      );
      
      this.logger.log(
        `Convert result: ${result.converted_amount} ${dto.to_currency} (rate: ${result.rate}, provider: ${result.provider}, cache: ${result.from_cache})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Convert error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('rate')
  @ApiOperation({ summary: 'Obtener tasa de cambio' })
  @ApiResponse({ status: 200, description: 'Tasa obtenida exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 500, description: 'Error del servidor' })
  async getExchangeRate(@Body() dto: GetExchangeRateDto) {
    this.logger.log(
      `Rate request: ${dto.from_currency} → ${dto.to_currency}`,
    );

    try {
      const result = await this.fxService.getExchangeRate(
        dto.from_currency,
        dto.to_currency,
      );
      
      this.logger.log(
        `Rate result: ${result.rate} (provider: ${result.provider}, cache: ${result.from_cache})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Rate error: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('rates')
  @ApiOperation({ summary: 'Obtener múltiples tasas de cambio' })
  @ApiResponse({ status: 200, description: 'Tasas obtenidas exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 500, description: 'Error del servidor' })
  async getRates(@Body() dto: GetRatesDto) {
    this.logger.log(
      `Rates request: base=${dto.base_currency}, targets=${dto.target_currencies.join(', ')}`,
    );

    try {
      const result = await this.fxService.getRates(
        dto.base_currency,
        dto.target_currencies,
      );
      
      this.logger.log(
        `Rates result: ${Object.keys(result.rates).length} rates (provider: ${result.provider}, cache: ${result.from_cache})`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Rates error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
