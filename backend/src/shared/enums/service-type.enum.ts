export enum ServiceType {
  SERVICE_TYPE_UNSPECIFIED = 0,
  STANDARD = 1,
  EXPRESS = 2,
  SAME_DAY = 3,
}

// Multiplicadores en porcentaje (100 = 1.00, 135 = 1.35, 180 = 1.80)
export const SERVICE_MULTIPLIERS: Record<ServiceType, number> = {
  [ServiceType.SERVICE_TYPE_UNSPECIFIED]: 100,
  [ServiceType.STANDARD]: 100, // 1.00
  [ServiceType.EXPRESS]: 135, // 1.35
  [ServiceType.SAME_DAY]: 180, // 1.80
};
