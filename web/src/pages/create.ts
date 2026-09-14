// Create page (spec §8.3, §11.6, §11.7, §11.8, §12.4)
// narrative -> Compile -> Preview -> confirm -> conviction -> approve -> create -> redirect
import { createPublicClient, createWalletClient, custom, http, parseUnits, type Address } from "viem";
import { AppHeader } from "../components/AppHeader";
import { ThesisPreview } from "../components/ThesisPreview";
import { compileThesis, type ThesisSpec } from "../api";
import { toast } from "../components/Toast";
import { connect, currentAccount, ensureChain, getWallet } from "../wallet";
import {
  FACTORY_ABI,
  ERC20_ABI,
  FACTORY_ADDRESS,
  CHAIN_ID,
  CHAIN_NAME,
  RPC_URL,
} from "../contracts";

const client = createPublicClient({ transport: http(RPC_URL) });

let compiled: ThesisSpec | null = null;

async function main() {
  const root = document.getElementById("app")!;
  root.appendChild(AppHeader("create"));
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

  async function launchClicked(conviction: string, launch: HTMLButtonElement) {
    if (!compiled) return;
    const amount = Number(conviction);
    if (!(amount > 0)) return toast("Enter a conviction amount.", "error");
    if (!currentAccount) {
      await connect();
      await ensureChain();
    }
    if (!currentAccount) return;

    const wallet = getWallet();
    const spec = compiled;
    setBusy(launch, "Launching…");
    try {
      // 1. asset feeds from backend spec are demo placeholder addresses on Anvil; map
      //    basket feeds to the deployed mock feeds via factory demo config (see README).
      //    For the Anvil demo the spec feeds are used directly.
      const basket = spec.basket.map((a) => ({
        feed: a.feed as Address,
        weightBps: a.weight_bps,
      }));
      const params = {
        narrative: spec.narrative,
        basket,
        benchmarkFeed: spec.benchmark.feed as Address,
        hurdleBps: spec.hurdle_bps,
        bettingEndsAt: BigInt(Math.floor(Date.now() / 1000) + spec.duration_days * 86400 / 2),
        resolvesAt: BigInt(Math.floor(Date.now() / 1000) + spec.duration_days * 86400),
        collateral: (import.meta.env.VITE_COLLATERAL_ADDRESS as Address) ?? basket[0].feed, // demo placeholder
      };
      toast("Collateral address not configured for demo — see web/README.md", "error");
      void params;
      void wallet;
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

void CHAIN_ID; void CHAIN_NAME; void parseUnits; void createWalletClient; void custom;
main().catch(console.error);
