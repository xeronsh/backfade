// Feed page (spec §8.2) — reads factory markets from chain, cards link to detail.
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { AppHeader, TestnetBanner } from "../components/AppHeader";
import { ThesisCard } from "../components/ThesisCard";
import type { MarketState } from "../components/MarketStatus";
import { FACTORY_ABI, MARKET_ABI, FACTORY_ADDRESS, RPC_URL } from "../contracts";
import { formatUsd } from "../format";

const client = createPublicClient({ transport: http(RPC_URL) });

async function main() {
  const root = document.getElementById("app")!;
  root.appendChild(AppHeader("feed"));
  root.appendChild(TestnetBanner());
  const page = document.createElement("main");
  page.className = "page page--feed";
  root.appendChild(page);

  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "Feed";
  page.appendChild(title);

  const feed = document.createElement("div");
  feed.id = "feed-list";
  page.appendChild(feed);

  try {
    const count = Number(await client.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "marketsLength" }));
    if (count === 0) renderEmpty(feed);
    // newest first
    for (let i = count - 1; i >= 0; i--) {
      const market = (await client.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "marketAt", args: [BigInt(i)] })) as Address;
      feed.appendChild(await renderCard(market));
    }
  } catch (e) {
    renderEmpty(feed, (e as Error).message);
  }
}

function renderEmpty(feed: HTMLElement, error?: string) {
  feed.innerHTML = "";
  const el = document.createElement("div");
  el.className = "empty";
  el.innerHTML = `<div class="empty__title">No theses yet</div><p>${error ? escapeHtml(error) : "Be the first to post a thesis."}</p><p style="margin-top:16px"><a class="btn btn--primary" href="create.html">Create thesis</a></p>`;
  feed.appendChild(el);
}

async function renderCard(marketAddress: Address): Promise<HTMLElement> {
  const read = <F extends (typeof MARKET_ABI)[number]["name"]>(fn: F, args: unknown[] = []) =>
    client.readContract({ address: marketAddress, abi: MARKET_ABI, functionName: fn as never, args: args as never }) as Promise<never>;

  const [narrative, hurdleBps, bettingEndsAt, resolvesAt, creator, creatorBond, backPool, fadePool, outcome] =
    await Promise.all([
      read("narrative") as Promise<string>,
      read("hurdleBps") as Promise<number>,
      read("bettingEndsAt") as Promise<bigint>,
      read("resolvesAt") as Promise<bigint>,
      read("creator") as Promise<Address>,
      read("creatorBond") as Promise<bigint>,
      read("backPool") as Promise<bigint>,
      read("fadePool") as Promise<bigint>,
      read("outcome") as Promise<number>,
    ]);

  const now = BigInt(Math.floor(Date.now() / 1000));
  let state: MarketState;
  if (outcome === 1) state = "PROVEN";
  else if (outcome === 2) state = "FAILED";
  else if (outcome === 3) state = "CANCELLED";
  else if (now >= resolvesAt) state = "READY";
  else if (now >= bettingEndsAt) state = "CLOSED";
  else state = "OPEN";

  const totalPool = backPool + fadePool;
  const backPctBps = totalPool === 0n ? 0 : Number((backPool * 10000n) / totalPool);

  return ThesisCard({
    market: marketAddress,
    creator,
    spec: null,
    narrative,
    condition: `Basket outperforms benchmark by +${Number(hurdleBps) / 100}% — settled by oracle prices.`,
    creatorBond,
    backPctBps,
    totalPool,
    bettingEndsAt,
    state,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

void formatUnits;
main().catch(console.error);
