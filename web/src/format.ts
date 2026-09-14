// formatting helpers
export function formatUsd(amount: bigint, decimals = 18): string {
  const value = Number(amount) / 10 ** decimals;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(value < 10 ? 2 : 0)}`;
}

export function formatPct(bps: number | bigint): string {
  return `${(Number(bps) / 100).toFixed(0)}%`;
}

export function timeLeft(unixSeconds: bigint | number): string {
  const secs = Number(unixSeconds) - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "ended";
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((secs % 3600) / 60);
  return `${hours}h ${mins}m left`;
}

export function bpsToSignedPct(bps: bigint | number): string {
  const v = Number(bps) / 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}
