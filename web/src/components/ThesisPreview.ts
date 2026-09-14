// ThesisPreview (spec §11.7) — every financial field inspectable before launch
import type { ThesisSpec } from "../api-types";
import { formatPct } from "../format";

export function ThesisPreview(spec: ThesisSpec): HTMLElement {
  const root = document.createElement("div");
  root.className = "preview";

  const narrative = document.createElement("p");
  narrative.className = "text-2";
  narrative.textContent = spec.narrative;
  root.appendChild(narrative);

  const grid = document.createElement("div");
  grid.className = "preview__grid";

  const basketField = field(
    "Basket",
    spec.basket
      .map((a) => `<div>${a.symbol} <span class="pct">${formatPct(a.weight_bps)}</span></div>`)
      .join("")
  );
  const benchmarkField = field("Benchmark", spec.benchmark.symbol);
  const hurdleField = field("Narrative Alpha target", `+${formatPct(spec.hurdle_bps)}`);
  const windowField = field("Window", `${spec.duration_days} days`);
  grid.append(basketField, benchmarkField, hurdleField, windowField);

  const condition = field("Machine-verifiable condition", escapeHtml(spec.human_condition));
  condition.style.gridColumn = "1 / -1";

  const risk = field("Risk", spec.risk.level);
  grid.append(condition, risk);
  root.appendChild(grid);
  return root;
}

function field(label: string, valueHtml: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "preview__field";
  const l = document.createElement("div");
  l.className = "preview__label";
  l.textContent = label;
  const v = document.createElement("div");
  v.className = "preview__value";
  v.innerHTML = valueHtml;
  el.append(l, v);
  return el;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
