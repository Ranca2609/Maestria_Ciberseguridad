export interface IPackage {
  weightKg: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  fragile: boolean;
  declaredValueCents: number;
}

export interface IPackageWithCalculations extends IPackage {
  volumetricKg: number;
  billableKg: number;
}
