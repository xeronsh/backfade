import { formatUnits } from "viem";

export function shortAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function formatAmount(
  value: bigint | undefined,
  decimals = 18,
  fractionDigits = 2,
) {
  if (value === undefined) return "—";
  const formatted = formatUnits(value, decimals);
  const [whole, fraction = ""] = formatted.split(".");
  return fractionDigits === 0
    ? whole
    : `${whole}.${fraction.slice(0, fractionDigits).padEnd(fractionDigits, "0")}`;
}

export function formatBps(value: number | bigint | undefined) {
  if (value === undefined) return "—";
  return `${(Number(value) / 100).toFixed(2)}%`;
}

export function formatDate(value: bigint | number | undefined) {
  if (value === undefined) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(value) * 1000));
}

export function formatError(
  error: unknown,
  fallback = "Something went wrong. Try again.",
) {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.toLowerCase();
  if (
    message.includes("user rejected") ||
    message.includes("rejected the request")
  )
    return "Wallet signature rejected. Nothing was submitted.";
  if (message.includes("insufficient funds"))
    return "Your wallet does not have enough balance for this action.";
  if (message.includes("chain") || message.includes("network"))
    return "Switch to Robinhood Chain Testnet and try again.";
  return error.message.slice(0, 180) || fallback;
}
