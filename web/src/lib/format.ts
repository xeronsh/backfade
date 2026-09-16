import { formatUnits } from "viem";
import { type Locale, translate } from "./i18n";

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

export function formatSignedAmount(
  value: bigint | undefined,
  decimals = 18,
  fractionDigits = 2,
) {
  if (value === undefined) return "—";
  const sign = value > 0n ? "+" : value < 0n ? "−" : "";
  return `${sign}${formatAmount(value < 0n ? -value : value, decimals, fractionDigits)}`;
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
  locale: Locale = "en",
  fallback?: string,
) {
  const generic = fallback ?? translate(locale, "error.generic");
  if (!(error instanceof Error)) return generic;
  const message = error.message.toLowerCase();
  if (
    message.includes("user rejected") ||
    message.includes("rejected the request")
  )
    return translate(locale, "error.rejected");
  if (message.includes("insufficient funds"))
    return translate(locale, "error.insufficient");
  if (message.includes("chain") || message.includes("network"))
    return translate(locale, "error.wrongChain");
  return error.message.slice(0, 180) || generic;
}
