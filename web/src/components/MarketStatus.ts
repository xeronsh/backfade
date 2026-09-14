// MarketStatus pill (spec §11.9)
export type MarketState = "OPEN" | "CLOSED" | "READY" | "PROVEN" | "FAILED" | "CANCELLED";

export function MarketStatus(state: MarketState): HTMLElement {
  const el = document.createElement("span");
  el.className = `pill pill--${state.toLowerCase()}`;
  el.textContent = state;
  return el;
}
