// ThesisCard — feed card. CTA clicks must not trigger card navigation.
import type { ThesisSpec } from "../api-types";
import { ConvictionBar } from "./ConvictionBar";
import { MarketStatus, type MarketState } from "./MarketStatus";
import { shortAddress } from "../wallet";
import { formatUsd, timeLeft } from "../format";

export interface ThesisCardProps {
  market: string;
  creator: string;
  spec: ThesisSpec | null;
  narrative: string;
  condition: string;
  creatorBond: bigint;
  backPctBps: number;
  totalPool: bigint;
  bettingEndsAt: bigint;
  state: MarketState;
}

export function ThesisCard(props: ThesisCardProps): HTMLElement {
  const card = document.createElement("a");
  card.className = "card";
  card.href = `market.html?address=${props.market}`;
  card.style.display = "block";

  const meta = document.createElement("div");
  meta.className = "card__meta";
  const creator = document.createElement("span");
  creator.textContent = shortAddress(props.creator);
  const sep1 = document.createElement("span");
  sep1.textContent = "•";
  const time = document.createElement("span");
  time.textContent = timeLeft(props.bettingEndsAt);
  meta.append(creator, sep1, time, MarketStatus(props.state));

  const narrative = document.createElement("div");
  narrative.className = "card__narrative";
  narrative.textContent = props.narrative;

  const condition = document.createElement("div");
  condition.className = "card__condition";
  condition.textContent = props.condition;

  const row = document.createElement("div");
  row.className = "card__row";
  const conviction = document.createElement("span");
  conviction.innerHTML = `Creator Conviction <strong>${formatUsd(props.creatorBond)}</strong>`;
  const total = document.createElement("span");
  total.textContent = formatUsd(props.totalPool);
  row.append(conviction, total);

  card.append(meta, narrative, condition, row);

  if (props.spec) {
    // nothing extra in v0.1 — spec shown on detail page
  }
  card.appendChild(ConvictionBar(props.backPctBps));
  return card;
}
