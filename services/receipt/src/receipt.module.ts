import { Module } from '@nestjs/common';
import { ReceiptController } from './receipt.controller';
import { ReceiptGenerator } from './generators';

@Module({
  controllers: [ReceiptController],
  providers: [ReceiptGenerator],
  exports: [ReceiptGenerator],
})
export class ReceiptModule {}
