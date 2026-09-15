import { config } from "../config";

export const addresses = {
  factory: config.factoryAddress,
  collateral: config.collateralAddress,
} as const;
