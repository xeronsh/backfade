// Profile page (spec §8.5) — /profile.html?address=0x…
import { createPublicClient, http, formatUnits, type Address } from "viem";
import { AppHeader, TestnetBanner } from "../components/AppHeader";
import { FACTORY_ABI, MARKET_ABI, FACTORY_ADDRESS, RPC_URL } from "../contracts";

const client = createPublicClient({ transport: http(RPC_URL) });

async function main() {
  const root = document.getElementById("app")!;
  root.appendChild(AppHeader("profile"));
  root.appendChild(TestnetBanner());
  const page = document.createElement("main");
  page.className = "page";
  root.appendChild(page);

  const address = new URLSearchParams(location.search).get("address") as Address | null;
  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = address ? `${address.slice(0, 8)}…` : "Profile";
  page.appendChild(title);

  if (!address) {
    page.appendChild(Object.assign(document.createElement("p"), { className: "muted", textContent: "No address given." }));
    return;
  }

  let proven = 0;
  let failed = 0;
  let created = 0;
  let capitalBonded = 0n;

  try {
    const count = Number(await client.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "marketsLength" }));
    for (let i = 0; i < count; i++) {
      const market = (await client.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "marketAt", args: [BigInt(i)] })) as Address;
      const creator = (await client.readContract({ address: market, abi: MARKET_ABI, functionName: "creator" })) as Address;
      if (creator.toLowerCase() !== address.toLowerCase()) continue;
      created++;
      const [bond, outcome] = await Promise.all([
        client.readContract({ address: market, abi: MARKET_ABI, functionName: "creatorBond" }) as Promise<bigint>,
        client.readContract({ address: market, abi: MARKET_ABI, functionName: "outcome" }) as Promise<number>,
      ]);
      capitalBonded += bond;
      if (outcome === 1) proven++;
      else if (outcome === 2) failed++;
    }
  } catch (e) {
    page.appendChild(
      Object.assign(document.createElement("p"), { className: "muted", textContent: `Chain read failed: ${(e as Error).message}` })
    );
  }

  const resolved = proven + failed;
  const proofRate = resolved === 0 ? "—" : `${Math.round((proven / resolved) * 100)}%`;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="kv"><span class="kv__key">Resolved theses</span><span class="kv__val">${resolved}</span></div>
    <div class="kv"><span class="kv__key">Proven</span><span class="kv__val">${proven}</span></div>
    <div class="kv"><span class="kv__key">Failed</span><span class="kv__val">${failed}</span></div>
    <div class="kv"><span class="kv__key">Proof Rate</span><span class="kv__val">${proofRate}</span></div>
    <div class="kv"><span class="kv__key">Capital bonded</span><span class="kv__val">${formatUnits(capitalBonded, 18)} USDG</span></div>`;
  page.appendChild(card);
}

main().catch(console.error);
