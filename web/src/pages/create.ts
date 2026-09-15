// Create page — narrative -> Compile -> Preview -> confirm -> conviction -> approve -> create
import { createPublicClient, http, parseUnits, decodeEventLog, type Address } from "viem";
import { AppHeader, TestnetBanner } from "../components/AppHeader";
import { ThesisPreview } from "../components/ThesisPreview";
import { compileThesis, type ThesisSpec } from "../api";
import { toast } from "../components/Toast";
import { connect, currentAccount, ensureChain, getWallet } from "../wallet";
import {
  FACTORY_ABI,
  ERC20_ABI,
  FACTORY_ADDRESS,
  COLLATERAL_ADDRESS,
  RPC_URL,
} from "../contracts";

const client = createPublicClient({ transport: http(RPC_URL) });

let compiled: ThesisSpec | null = null;

async function main() {
  const root = document.getElementById("app")!;
  root.appendChild(AppHeader("create"));
  root.appendChild(TestnetBanner());
  const page = document.createElement("main");
  page.className = "page page--create";
  root.appendChild(page);

  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = "What's your thesis?";
  page.appendChild(title);

  const composer = document.createElement("div");
  composer.className = "card composer";
  const textarea = document.createElement("textarea");
  textarea.maxLength = 280;
  textarea.placeholder = "e.g. AI is rotating into nuclear energy.";
  textarea.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void compileClicked();
  });
  const footer = document.createElement("div");
  footer.className = "composer__footer";
  const count = document.createElement("span");
  count.className = "composer__count";
  textarea.addEventListener("input", () => {
    count.textContent = `${textarea.value.length}/280`;
    count.style.visibility = textarea.value.length >= 220 ? "visible" : "hidden";
  });
  const compileBtn = document.createElement("button");
  compileBtn.className = "btn btn--primary";
  compileBtn.textContent = "Compile thesis";
  compileBtn.addEventListener("click", () => void compileClicked());
  footer.append(count, compileBtn);
  composer.append(textarea, footer);
  page.appendChild(composer);

  const result = document.createElement("div");
  result.id = "result";
  page.appendChild(result);

  async function compileClicked() {
    const text = textarea.value.trim();
    if (!text) return toast("Write your thesis first.", "error");
    setBusy(compileBtn, "Structuring your thesis…");
    try {
      compiled = await compileThesis(text);
      renderPreview();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      restore(compileBtn, "Compile thesis");
    }
  }

  function renderPreview() {
    if (!compiled) return;
    result.innerHTML = "";

    const previewCard = document.createElement("div");
    previewCard.className = "card";
    previewCard.appendChild(ThesisPreview(compiled));

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;margin-top:16px";
    const recompile = document.createElement("button");
    recompile.className = "btn";
    recompile.textContent = "Recompile";
    recompile.addEventListener("click", () => void compileClicked());
    actions.appendChild(recompile);
    previewCard.appendChild(actions);
    result.appendChild(previewCard);

    // conviction input
    const convictionCard = document.createElement("div");
    convictionCard.className = "card";
    const label = document.createElement("div");
    label.style.cssText = "font-weight:600;margin-bottom:4px";
    label.textContent = "Your conviction";
    const helper = document.createElement("div");
    helper.className = "muted";
    helper.style.cssText = "font-size:13px;margin-bottom:12px";
    helper.textContent = "This capital backs your thesis and follows the same market outcome.";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.placeholder = "500";
    input.style.cssText =
      "width:100%;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text-1);padding:12px;font-size:16px";
    const presets = document.createElement("div");
    presets.className = "presets";
    for (const v of ["25", "100", "500"]) {
      const b = document.createElement("button");
      b.className = "btn";
      b.textContent = `$${v}`;
      b.addEventListener("click", () => (input.value = v));
      presets.appendChild(b);
    }
    convictionCard.append(label, helper, input, presets);

    const launch = document.createElement("button");
    launch.className = "btn btn--primary btn--wide";
    launch.style.marginTop = "16px";
    launch.textContent = "Launch thesis";
    launch.addEventListener("click", () => void launchClicked(input.value, launch));
    convictionCard.appendChild(launch);
    result.appendChild(convictionCard);
  }

  async function launchClicked(convictionInput: string, launch: HTMLButtonElement) {
    if (!compiled) return;
    // Parse the decimal string straight to base units. Routing through Number() would lose
    // precision on large values and accept forms like "1e3" that parseUnits rejects.
    let conviction: bigint;
    try {
      conviction = parseUnits(convictionInput.trim(), 18);
    } catch {
      return toast("Enter a valid amount.", "error");
    }
    if (conviction <= 0n) return toast("Enter a conviction amount.", "error");

    if (!currentAccount) {
      await connect();
      await ensureChain();
    }
    if (!currentAccount) return;

    const wallet = getWallet();
    const spec = compiled;
    setBusy(launch, "Launching…");
    try {
      // 1. approve collateral to factory, then create market with creator bond
      const collateral = COLLATERAL_ADDRESS;
      const factory = FACTORY_ADDRESS;
      const allowance = (await client.readContract({
        address: collateral, abi: ERC20_ABI, functionName: "allowance",
        args: [currentAccount!, factory],
      })) as bigint;
      if (allowance < conviction) {
        toast("Approval required — confirm in wallet.", "info");
        const approveTx = await wallet.writeContract({
          chain: null, account: currentAccount!,
          address: collateral, abi: ERC20_ABI, functionName: "approve", args: [factory, conviction],
        });
        await client.waitForTransactionReceipt({ hash: approveTx });
      }
      // All times are unix seconds derived from the compiled spec, never browser-local date
      // strings. bettingEndsAt is a short entry window; resolvesAt honours the compiler's
      // duration_days so the onchain expiry matches the thesis the user saw.
      const now = Math.floor(Date.now() / 1000);
      const durationDays = spec.duration_days > 0 ? spec.duration_days : 30;
      const params = {
        narrative: spec.narrative,
        basket: spec.basket.map((a) => ({ feed: a.feed as Address, weightBps: a.weight_bps })),
        benchmarkFeed: spec.benchmark.feed as Address,
        hurdleBps: spec.hurdle_bps,
        bettingEndsAt: BigInt(now + 1800),
        resolvesAt: BigInt(now + durationDays * 86400),
        collateral,
      };
      const tx = await wallet.writeContract({
        chain: null, account: currentAccount!,
        address: factory, abi: FACTORY_ABI, functionName: "createMarket",
        args: [params, conviction],
      });
      toast("Thesis submitted — waiting for receipt…", "info");
      const receipt = await client.waitForTransactionReceipt({ hash: tx });
      // The receipt carries every log from the transaction, including the collateral
      // ERC20 Transfer events, which are not in FACTORY_ABI. Decoding those throws, so
      // restrict to the factory's own logs and tolerate any that still do not decode.
      let marketAddr: string | null = null;
      for (const l of receipt.logs) {
        if (l.address.toLowerCase() !== factory.toLowerCase()) continue;
        try {
          const ev = decodeEventLog({ abi: FACTORY_ABI, data: l.data, topics: l.topics });
          if (ev.eventName === "MarketCreated" && ev.args && "market" in ev.args) {
            marketAddr = String(ev.args.market);
            break;
          }
        } catch {
          // not a factory event we know about — skip it
        }
      }
      toast("Thesis launched onchain.", "success");
      if (marketAddr) window.location.href = `market.html?address=${marketAddr}`;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Launch failed. Check your wallet and try again.", "error");
    } finally {
      restore(launch, "Launch thesis");
    }
  }
}

function setBusy(btn: HTMLButtonElement, text: string) {
  btn.setAttribute("data-label", btn.textContent ?? "");
  btn.textContent = text;
  (btn as HTMLButtonElement & { style: CSSStyleDeclaration }).style.width = `${btn.offsetWidth}px`;
  btn.disabled = true;
}

function restore(btn: HTMLButtonElement, fallback: string) {
  btn.textContent = btn.getAttribute("data-label") ?? fallback;
  btn.disabled = false;
}

main().catch(console.error);
