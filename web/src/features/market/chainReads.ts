export interface ContractResult {
  status: "success" | "failure";
  result?: unknown;
}

export function readContractResult<T>(
  value: ContractResult | undefined,
): T | undefined {
  return value?.status === "success" ? (value.result as T) : undefined;
}

export function requireContractResult<T>(
  value: ContractResult | undefined,
  label: string,
): T {
  const result = readContractResult<T>(value);
  if (result === undefined) {
    throw new Error(`Chain read incomplete: ${label}.`);
  }
  return result;
}
