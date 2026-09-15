// Market detail page — /market.html?address=0x…
import { createPublicClient, http, formatUnits, parseUnits, type Address } from "viem";
import { AppHeader, TestnetBanner } from "../components/AppHeader";
import { ConvictionBar } from "../components/ConvictionBar";
import { MarketStatus } from "../components/MarketStatus";
import { toast } from "../components/Toast";
import { connect, currentAccount, ensureChain, getWallet, shortAddress } from "../wallet";
import { MARKET_ABI, ERC20_ABI, RPC_URL } from "../contracts";
import { marketState } from "../market-lifecycle";
import { getAssets } from "../api";
import { formatUsd, timeLeft, bpsToSignedPct } from "../format";

const client = createPublicClient({ transport: http(RPC_URL) });

let side: "back" | "fade" | null = null;

async function main() {
  const root = document.getElementById("app")!;
  root.appendChild(AppHeader("feed"));
  root.appendChild(TestnetBanner());
  const page = document.createElement("main");
  page.className = "page page--market";
  root.appendChild(page);

  const address = new URLSearchParams(location.search).get("address") as Address | null;
  if (!address) {
    page.innerHTML = '<div class="empty"><div class="empty__title">Market not found</div></div>';
    return;
  }

  await renderMarket(page, address);
  page.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (t.matches("[data-action=refresh]")) void renderMarket(page, address);
  });
}

/// Feed address -> symbol, from the compiler API. Falls back to a short address so the page
/// still renders when the API is offline.
async function feedSymbols(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    for (const a of await getAssets()) map.set(a.feed.toLowerCase(), a.symbol);
  } catch {
    // API offline — short addresses are shown instead
  }
  return map;
}

async function renderMarket(page: HTMLElement, address: Address) {
  const read = <F extends (typeof MARKET_ABI)[number]["name"]>(fn: F, args: unknown[] = []) =>
    client.readContract({ address, abi: MARKET_ABI, functionName: fn as never, args: args as never }) as Promise<never>;

  const [
    narrative,
    hurdleBps,
    bettingEndsAt,
    resolvesAt,
    settlementWindow,
    creator,
    creatorBond,
    backPool,
    fadePool,
    outcome,
    alpha,
    basketLen,
    benchmarkFeed,
  ] = await Promise.all([
    read("narrative") as Promise<string>,
    read("hurdleBps") as Promise<number>,
    read("bettingEndsAt") as Promise<bigint>,
    read("resolvesAt") as Promise<bigint>,
    read("settlementWindow") as Promise<bigint>,
    read("creator") as Promise<Address>,
    read("creatorBond") as Promise<bigint>,
    read("backPool") as Promise<bigint>,
    read("fadePool") as Promise<bigint>,
    read("outcome") as Promise<number>,
    read("narrativeAlphaBps") as Promise<bigint>,
    read("basketLength") as Promise<bigint>,
    read("benchmarkFeed") as Promise<Address>,
  ]);

  const n = Number(basketLen);
  const basket = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      read("basketAsset", [i]) as Promise<readonly [Address, number]>,
    ),
  );

  const symbols = await feedSymbols();
  const label = (feed: string) => symbols.get(feed.toLowerCase()) ?? shortAddress(feed);

  const collateral = (await read("collateral")) as Address;
  const [symbol, decimals] = await Promise.all([
    client.readContract({ address: collateral, abi: ERC20_ABI, functionName: "symbol" }) as Promise<string>,
    client.readContract({ address: collateral, abi: ERC20_ABI, functionName: "decimals" }) as Promise<number>,
  ]);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const state = marketState({ outcome, resolvesAt, settlementWindow, bettingEndsAt, now });

  page.innerHTML = "";
  const wrap = document.createElement("div");

  const header = document.createElement("div");
  header.className = "market-header";
  const meta = document.createElement("div");
  meta.className = "card__meta";
  meta.append(
    Object.assign(document.createElement("span"), { textContent: shortAddress(creator) }),
    Object.assign(document.createElement("span"), { textContent: "•" }),
    MarketStatus(state)
  );
  const h1 = document.createElement("h1");
  h1.textContent = narrative;
  header.append(meta, h1);
  wrap.appendChild(header);

  // conviction + action
  const marketCard = document.createElement("div");
  marketCard.className = "card";
  const total = backPool + fadePool;
  const backPct = total === 0n ? 0 : Number((backPool * 10000n) / total);
  marketCard.appendChild(ConvictionBar(backPct));

  const pools = document.createElement("div");
  pools.className = "card__row";
  pools.style.marginTop = "12px";
  pools.innerHTML = `<span>${formatUsd(backPool)} BACK</span><span>${formatUsd(fadePool)} FADE</span><span class="muted">${formatUnits(total, decimals)} ${symbol} total</span>`;
  marketCard.appendChild(pools);

  if (state === "OPEN") {
    const amount = document.createElement("input");
    amount.type = "number";
    amount.min = "0";
    amount.placeholder = `Amount in ${symbol}`;
    amount.style.cssText =
      "width:100%;margin-top:16px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text-1);padding:12px;font-size:16px";
    const btns = document.createElement("div");
    btns.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px";
    const backBtn = document.createElement("button");
    backBtn.className = "btn btn--back";
    backBtn.textContent = "BACK";
    const fadeBtn = document.createElement("button");
    fadeBtn.className = "btn btn--fade";
    fadeBtn.textContent = "FADE";
    backBtn.addEventListener("click", () => select("back"));
    fadeBtn.addEventListener("click", () => select("fade"));
    function select(s: "back" | "fade") {
      side = s;
      backBtn.classList.toggle("selected", s === "back");
      fadeBtn.classList.toggle("selected", s === "fade");
    }
    const submit = document.createElement("button");
    submit.className = "btn btn--primary btn--wide";
    submit.style.marginTop = "12px";
    submit.textContent = "Take position";
    submit.addEventListener("click", () => void takePosition(address, collateral, amount.value, decimals));
    btns.append(backBtn, fadeBtn);
    marketCard.append(amount, btns, submit);
  } else if (state === "READY") {
    const resolveBtn = document.createElement("button");
    resolveBtn.className = "btn btn--primary btn--wide";
    resolveBtn.style.marginTop = "16px";
    resolveBtn.textContent = "Resolve";
    resolveBtn.addEventListener("click", () => void resolveMarket(address));
    marketCard.appendChild(resolveBtn);
  } else if (state === "CANCELLABLE") {
    marketCard.appendChild(
      note(
        "The settlement window closed without an acceptable oracle print. Anyone can cancel the market, after which every participant refunds their own stake.",
      ),
    );
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn--primary btn--wide";
    cancelBtn.style.marginTop = "16px";
    cancelBtn.textContent = "Cancel & enable refunds";
    cancelBtn.addEventListener("click", () => void cancelMarket(address));
    marketCard.appendChild(cancelBtn);
  } else if (state === "CANCELLED") {
    marketCard.appendChild(
      note("This market was cancelled. Every participant can withdraw their own stake."),
    );
    marketCard.appendChild(refundButton(address));
  } else if (state === "PROVEN" || state === "FAILED") {
    const info = document.createElement("div");
    info.className = "card__row";
    info.style.marginTop = "12px";
    info.innerHTML = `<span>Narrative Alpha</span><strong>${bpsToSignedPct(alpha)}</strong>`;
    marketCard.appendChild(info);
    const claimBtn = document.createElement("button");
    claimBtn.className = "btn btn--primary btn--wide";
    claimBtn.style.marginTop = "16px";
    claimBtn.textContent = "Claim";
    claimBtn.addEventListener("click", () => void claim(address));
    marketCard.appendChild(claimBtn);
  }
  wrap.appendChild(marketCard);

  // condition + timeline
  const detailCard = document.createElement("div");
  detailCard.className = "card";
  const basketRows = basket
    .map(([feed, weightBps]) => {
      const name = label(feed);
      const pct = Number(weightBps) / 100;
      return `<div class="kv"><span class="kv__key">${name}</span><span class="kv__val">${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%</span></div>`;
    })
    .join("");
  detailCard.innerHTML = `
    <div class="kv"><span class="kv__key">Basket</span><span class="kv__val"></span></div>
    ${basketRows}
    <div class="kv"><span class="kv__key">Benchmark</span><span class="kv__val">${label(benchmarkFeed)}</span></div>
    <div class="kv"><span class="kv__key">Hurdle</span><span class="kv__val">+${Number(hurdleBps) / 100}%</span></div>
    <div class="kv"><span class="kv__key">Condition</span><span class="kv__val">Basket ≥ benchmark + ${Number(hurdleBps) / 100}%</span></div>
    <div class="kv"><span class="kv__key">Creator conviction</span><span class="kv__val">${formatUsd(creatorBond)}</span></div>
    <div class="kv"><span class="kv__key">Betting ends</span><span class="kv__val">${timeLeft(bettingEndsAt)}</span></div>
    <div class="kv"><span class="kv__key">Resolves</span><span class="kv__val">${new Date(Number(resolvesAt) * 1000).toLocaleString()}</span></div>
    <div class="kv"><span class="kv__key">Market</span><span class="kv__val">${address}</span></div>`;
  wrap.appendChild(detailCard);

  page.appendChild(wrap);
}

function note(text: string): HTMLElement {
  const el = document.createElement("p");
  el.className = "muted";
  el.style.cssText = "margin-top:16px;font-size:14px;line-height:1.5";
  el.textContent = text;
  return el;
}

function actionButton(label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "btn btn--primary btn--wide";
  btn.style.marginTop = "16px";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  return btn;
}

/// Refund is idempotent from the user's point of view but reverts onchain once the stake is
/// zero, so the button is offered continuously and the revert is surfaced as a toast.
function refundButton(market: Address): HTMLButtonElement {
  return actionButton("Refund my stake", () => void refund(market));
}

async function takePosition(market: Address, collateral: Address, amountStr: string, decimals: number) {
  if (!side) return toast("Choose BACK or FADE.", "error");
  // Parse the decimal string directly to base units — no float round-trip.
  let amount: bigint;
  try {
    amount = parseUnits(amountStr.trim(), decimals);
  } catch {
    return toast("Enter a valid amount.", "error");
  }
  if (amount <= 0n) return toast("Enter a positive amount.", "error");

  if (!currentAccount) {
    await connect();
    await ensureChain();
  }
  const wallet = getWallet();

  try {
    // allowance check -> approve if needed
    const allowance = (await client.readContract({
      address: collateral,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [currentAccount!, market],
    })) as bigint;
    if (allowance < amount) {
      toast("Approval required — confirm in wallet.", "info");
      const approveTx = await wallet.writeContract({
        chain: null,
        account: currentAccount!,
        address: collateral,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [market, amount],
      });
      await client.waitForTransactionReceipt({ hash: approveTx });
      toast("Approval confirmed.", "success");
    }
    const tx = await wallet.writeContract({
      chain: null,
      account: currentAccount!,
      address: market,
      abi: MARKET_ABI,
      functionName: side,
      args: [amount],
    });
    toast("Transaction submitted.", "info");
    await client.waitForTransactionReceipt({ hash: tx });
    toast("Position confirmed.", "success");
    window.setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast((e as Error).message.slice(0, 160), "error");
  }
}

async function resolveMarket(market: Address) {
  if (!currentAccount) {
    await connect();
    await ensureChain();
  }
  try {
    const tx = await getWallet().writeContract({ chain: null, account: currentAccount!, address: market, abi: MARKET_ABI, functionName: "resolve" });
    toast("Resolving…", "info");
    await client.waitForTransactionReceipt({ hash: tx });
    toast("Market resolved.", "success");
    window.setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast((e as Error).message.slice(0, 160), "error");
  }
}

async function cancelMarket(market: Address) {
  if (!currentAccount) {
    await connect();
    await ensureChain();
  }
  try {
    const tx = await getWallet().writeContract({ chain: null, account: currentAccount!, address: market, abi: MARKET_ABI, functionName: "cancelAfterDeadline" });
    toast("Cancelling…", "info");
    await client.waitForTransactionReceipt({ hash: tx });
    toast("Market cancelled — refunds are open.", "success");
    window.setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast((e as Error).message.slice(0, 160), "error");
  }
}

async function claim(market: Address) {
  if (!currentAccount) {
    await connect();
    await ensureChain();
  }
  try {
    const tx = await getWallet().writeContract({ chain: null, account: currentAccount!, address: market, abi: MARKET_ABI, functionName: "claim" });
    toast("Claim submitted.", "info");
    await client.waitForTransactionReceipt({ hash: tx });
    toast("Claim confirmed.", "success");
    window.setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast((e as Error).message.slice(0, 160), "error");
  }
}

async function refund(market: Address) {
  if (!currentAccount) {
    await connect();
    await ensureChain();
  }
  try {
    const tx = await getWallet().writeContract({ chain: null, account: currentAccount!, address: market, abi: MARKET_ABI, functionName: "refund" });
    toast("Refund submitted.", "info");
    await client.waitForTransactionReceipt({ hash: tx });
    toast("Refund confirmed.", "success");
    window.setTimeout(() => location.reload(), 800);
  } catch (e) {
    toast((e as Error).message.slice(0, 160), "error");
  }
}

main().catch(console.error);
