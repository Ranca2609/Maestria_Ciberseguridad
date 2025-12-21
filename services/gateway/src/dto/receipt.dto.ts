// src/dto/receipt.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ReceiptDto {
  @ApiProperty({ example: 'rcpt_1734825607_abc123' })
  receiptId: string;

  @ApiProperty({ example: 'ord_abc123def456' })
  orderId: string;

  @ApiProperty({ example: '2025-12-21T12:34:56Z' })
  generatedAt: string;

  @ApiProperty({
    example: 1,
    description: '0=DRAFT, 1=GENERATED, 2=ERROR',
  })
  status: number;

  @ApiProperty({
    description: 'Contenido del recibo: base64 PDF, HTML, o texto',
    example: 'JVBERi0xLjQKJcOkw7zDtsO4...',
  })
  content: string;

  @ApiProperty({ enum: ['PDF', 'HTML', 'TEXT'], example: 'PDF' })
  format: 'PDF' | 'HTML' | 'TEXT';

  @ApiProperty({ example: '1.0' })
  version: string;

  @ApiProperty({
    example: {
      totalAmount: 150.5,
      currency: 'Q',
    },
  })
  meta: {
    totalAmount: number;
    currency: string;
    [key: string]: any;
  };

  // ✅ Constructor que acepta un objeto parcial
  constructor(partial: Partial<ReceiptDto>) {
    Object.assign(this, partial);
  }
}