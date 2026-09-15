// Thesis Compiler API client
import type { ThesisSpec } from "./api-types";
import { API_BASE } from "./contracts";

export type { ThesisSpec };

export async function compileThesis(text: string, preferredDurationDays = 30): Promise<ThesisSpec> {
  const res = await fetch(`${API_BASE}/v1/thesis/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, preferred_duration_days: preferredDurationDays }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error?.message ?? "Compilation failed. Try rephrasing your thesis.");
  }
  return body as ThesisSpec;
}

export interface AssetInfo {
  symbol: string;
  name: string;
  feed: string;
  enabled: boolean;
}

export async function getAssets(): Promise<AssetInfo[]> {
  const res = await fetch(`${API_BASE}/v1/assets`);
  if (!res.ok) return [];
  const body = await res.json();
  return body.assets;
}
