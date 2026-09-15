// MarketStatus pill
export type MarketState =
  | "OPEN"
  | "CLOSED"
  | "READY"
  | "CANCELLABLE"
  | "PROVEN"
  | "FAILED"
  | "CANCELLED";

export function MarketStatus(state: MarketState): HTMLElement {
  const el = document.createElement("span");
  el.className = `pill pill--${state.toLowerCase()}`;
  el.textContent = state;
  return el;
}
