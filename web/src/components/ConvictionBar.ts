// ConvictionBar (spec §11.4)
export function ConvictionBar(backPctBps: number): HTMLElement {
  const root = document.createElement("div");
  root.className = "conviction";

  const labels = document.createElement("div");
  labels.className = "conviction__labels";
  const back = document.createElement("span");
  back.className = "back";
  back.textContent = `BACK ${(backPctBps / 100).toFixed(0)}%`;
  const fade = document.createElement("span");
  fade.className = "fade";
  fade.textContent = `FADE ${(100 - backPctBps / 100).toFixed(0)}%`;
  labels.append(back, fade);

  const bar = document.createElement("div");
  bar.className = "conviction__bar";
  const fill = document.createElement("div");
  fill.className = "conviction__fill";
  fill.style.width = `${Math.min(100, backPctBps / 100)}%`;
  bar.appendChild(fill);

  root.append(labels, bar);
  return root;
}
