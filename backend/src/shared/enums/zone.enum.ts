export enum Zone {
  ZONE_UNSPECIFIED = 0,
  METRO = 1,
  INTERIOR = 2,
  FRONTERA = 3,
}

export const ZONE_RATES: Record<Zone, number> = {
  [Zone.ZONE_UNSPECIFIED]: 0,
  [Zone.METRO]: 800, // 8 quetzales = 800 centavos
  [Zone.INTERIOR]: 1200, // 12 quetzales = 1200 centavos
  [Zone.FRONTERA]: 1600, // 16 quetzales = 1600 centavos
};
