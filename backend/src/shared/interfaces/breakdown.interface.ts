export interface IBreakdown {
  orderBillableKg: number;
  ratePerKgCents: number;
  baseSubtotalCents: number;
  serviceMultiplierPercent: number;
  serviceSubtotalCents: number;
  fragileSurchargeCents: number;
  insuranceSurchargeCents: number;
  subtotalWithSurchargesCents: number;
  discountAmountCents: number;
  totalCents: number;
}
