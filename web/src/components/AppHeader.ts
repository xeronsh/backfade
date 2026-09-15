// AppHeader + WalletButton
import { connect, currentAccount, ensureChain, shortAddress } from "../wallet";

export function AppHeader(active: "feed" | "create" | "profile"): HTMLElement {
  const header = document.createElement("header");
  header.className = "header";

  const logo = document.createElement("a");
  logo.className = "header__logo";
  logo.href = "index.html";
  logo.textContent = "backfade";
  header.appendChild(logo);

  const nav = document.createElement("nav");
  nav.className = "header__nav";
  nav.appendChild(navLink("Feed", "index.html", active === "feed"));
  nav.appendChild(navLink("Create", "create.html", active === "create"));
  header.appendChild(nav);

  const spacer = document.createElement("div");
  spacer.className = "header__spacer";
  header.appendChild(spacer);

  header.appendChild(WalletButton());
  return header;
}

export function TestnetBanner(): HTMLElement {
  const el = document.createElement("div");
  el.className = "testnet-banner";
  el.textContent = "Robinhood Chain Testnet · Testnet collateral · No real funds";
  return el;
}

function navLink(label: string, href: string, isActive: boolean): HTMLAnchorElement {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = label;
  if (isActive) a.className = "active";
  return a;
}

export function WalletButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "btn";

  const render = () => {
    if (currentAccount) {
      btn.textContent = shortAddress(currentAccount);
    } else {
      btn.textContent = "Connect wallet";
    }
  };
  render();

  btn.addEventListener("click", async () => {
    if (currentAccount) return;
    btn.disabled = true;
    try {
      await connect();
      await ensureChain();
      render();
      window.dispatchEvent(new CustomEvent("wallet-connected"));
    } catch (e) {
      btn.textContent = "Connect wallet";
      window.dispatchEvent(new CustomEvent("wallet-error", { detail: (e as Error).message }));
    } finally {
      btn.disabled = false;
    }
  });

  return btn;
}
