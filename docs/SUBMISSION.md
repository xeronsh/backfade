# Backfade — Submission

> **Back the thesis. Fade the noise.**

Backfade turns market narratives into **bonded, benchmarked and verifiable onchain theses**.

Markets trade assets. Communities trade narratives.

---

## Live demo (Tunnel)

| Service | URL |
|---|---|
| Frontend (public HTTPS) | `https://water-moderate-exec-significance.trycloudflare.com` |
| Thesis Compiler API | `https://phi-diameter-block-earliest.trycloudflare.com` |

Both run **locally** (`vite preview` on `127.0.0.1:4173`, FastAPI on `127.0.0.1:8000`) and are
exposed through Cloudflare Quick Tunnels. No VPS, no database. The chain is the source of truth.

**Temporary development tunnel.** These Quick-Tunnel URLs are ephemeral by design and change
whenever the tunnel restarts. They are used for live testing and demo recording only. The final
submission URL will be a stable named tunnel (e.g. `dev.backfade.fun` / `api-dev.backfade.fun`)
or equivalent hosting — still served from the local stack, no VPS required.

## Network

| Field | Value |
|---|---|
| Network | Robinhood Chain Testnet |
| Chain ID | 46630 |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | https://explorer.testnet.chain.robinhood.com |

## Final contracts

All three are **source verified** (`Pass - Verified`) on the Robinhood Chain Testnet explorer.

| Contract | Address | Verified | Explorer |
|---|---|---|---|
| MockUSDG (testnet collateral) | `0xc1A90A395f66920F9927aE9B406Ba5716DAc261f` | ✅ | [link](https://explorer.testnet.chain.robinhood.com/address/0xc1a90a395f66920f9927ae9b406ba5716dac261f) |
| ThesisFactory | `0xCdadF4af7360FF99169936ba95574ABD5e389785` | ✅ | [link](https://explorer.testnet.chain.robinhood.com/address/0xcdadf4af7360ff99169936ba95574abd5e389785) |
| Demo ThesisMarket | `0x3655ACF4C91029D94E3aE29A2D7E794a42Da795C` | ✅ | [link](https://explorer.testnet.chain.robinhood.com/address/0x3655acf4c91029d94e3ae29a2d7e794a42da795c) |

Full deployment record: `docs/DEPLOYMENTS_FINAL.md`.

## Demo thesis

| Field | Value |
|---|---|
| Narrative | AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark. |
| Basket | AMD 60% + PLTR 40% |
| Benchmark | TSLA |
| Hurdle | +10% |
| Outcome | **FADE** — Narrative Alpha settled at **+2 bps**, far below the hurdle |

The narrative did not clear its hurdle and BACK lost. No oracle value was fabricated to produce
a prettier demo. Full transaction and recomputation trail: `docs/LIVE_E2E_FINAL.md`.

## Transactions

| Step | Tx |
|---|---|
| Create market (creator bond 500, BACK) | `0x571afc7de8ab8fd9ae16255709e4039fcc2f855ec6d219e2f435c5a62275123c` |
| Trader BACK 300 | `0x3d2b97eb9d834012b627d897019a7b95bb597b78adb2d8cafcbf64e36c498da0` |
| Trader FADE 200 | `0xd618c078dcba44e999e7e174d5ad482b03493067665c312f5c631881e777082c` |
| Resolve | `0xa8779821065f001a47a4cf3528cc31663f98286d79d4960ac443d6e955cbc4bf` |
| Winner claim | `0xcf546cb44cfcf5fe7686c2a19958cc1f65d20f006b9e78e88c80fa35886fe929` |

## Oracle evidence

Feeds are AggregatorV3-compatible **seeded testnet feeds**, not mainnet Chainlink proxies. This is
documented honestly rather than implied otherwise (`docs/TESTNET_ASSETS.md`).

### Measured feed cadence

Measured from approximately **4,000 real testnet update transactions** per feed:

| Percentile | Gap |
|---|---|
| median | 36–52 sec |
| p90 | 0.75–5.0 min |
| p99 | 2.8–6.2 min |
| worst observed | 21.1 h (TSLA / GME history) |

### Important limitation (not hidden)

Testnet AggregatorV3 feeds **do not expose `getRoundData` round history** (the selector is absent
from every feed's bytecode; calls revert with empty data). A "first post-expiry round" therefore
**cannot be cryptographically selected on this testnet**, so this is not what the protocol claims.

The shipped fallback, which is what the code actually enforces:

- **pre-expiry oracle updates are rejected** — `OracleMath: pre-expiry price`
- **settlement is bounded** to a per-market 30 minute window
- **stale or dead feeds lead to cancellation with a full refund**, never a stale-price settlement

The core integrity property was demonstrated on live testnet data:

```
resolvesAt      = 1789439524
TSLA updatedAt  = 1789439516  ->  resolve() REVERTED: OracleMath: pre-expiry price
TSLA updatedAt  = 1789439576  ->  resolve() SUCCEEDED
```

A pre-expiry price cannot settle a market.

## Testing

| Gate | Result |
|---|---|
| `forge test` | **67 passed / 0 failed** |
| Fuzz | 7 suites × 256 runs |
| Invariant | 6 suites × 64 runs × 2048 calls |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `uv run python selfcheck.py` | ALL BACKEND CHECKS PASSED |
| `python3 scripts/abi_parity.py` | ABI PARITY OK |
| Secret scan | no keys tracked, none in history |
| Explorer source verification | MockUSDG ✅ · ThesisFactory ✅ · Demo ThesisMarket ✅ (`Pass - Verified`) |

## Architecture

```text
Browser  ──HTTPS──▶  Cloudflare Tunnel  ──▶  Vite preview :4173   (frontend)
                                         └─▶  FastAPI      :8000   (thesis compiler)

Frontend ──RPC──▶  Robinhood Chain Testnet 46630  (contracts, chain = source of truth)
```

No PostgreSQL, no SQLite, no Redis, no indexer, no queue. Feed and profile read
`Factory.marketsLength()` / `Factory.marketAt()` and contract events directly.

## Innovation

1. **Narrative → Financial Claim.** Natural-language market narratives become deterministic,
   machine-verifiable financial specifications: a weighted basket, a benchmark, an explicit hurdle,
   and an expiry.
2. **Creator Conviction.** Every thesis creator must put capital behind the claim; the bond is
   locked as BACK stake until resolution, so publishing a view is never free.
3. **Narrative Alpha.** Performance is judged relative to a benchmark instead of absolute price
   movement. A basket that rises but trails its benchmark still loses.

## Known limitations

- Testnet only. MockUSDG has no real value; its mint is permissionless by design for the demo.
- Testnet feeds are **seeded AggregatorV3 feeds** and do not implement `getRoundData()`, so
  settlement uses the latest observation inside the market's window rather than a specific round.
- Settlement window is 30 minutes, calibrated to measured feed cadence (~36–52 s median, p99
  ~6 min, one historical 21 h outage). Inside the window a resolver has bounded discretion over
  which legal observation is used; shorter windows would risk forced cancels.
- A dead feed ends in `cancel()` with a full refund rather than a stale-price settlement.
- Pari-mutuel floor division may leave sub-wei dust per winner; a single winner drains the market
  to exactly zero.
- No secondary trading, no order book, no database/indexer, limited asset universe.
- Not audited for production capital.

See `SECURITY.md` for the full security posture.

---

## Judge review — the six questions

**1. Why is this not Polymarket?**

Polymarket prices *event probability* — will X happen, yes or no. Backfade prices whether an
**investment narrative generates benchmark-relative alpha**. The traded object is not an event
outcome; it is whether a basket outperforms a benchmark by a required margin.

**2. Why does the Creator Bond exist?**

It turns a free market opinion into a **costly signal**. Posting a take costs nothing and can be
deleted. Bonding capital means the creator is exposed to being wrong.

**3. Why is this not just an index builder?**

The basket is only the **machine representation** of a narrative. The traded object is the thesis
and its alpha against a benchmark, with a hurdle and a settlement deadline. An index has no
counterparty, no hurdle, and no resolution.

**4. Why Robinhood Chain?**

Because Backfade turns real-world stock narratives into onchain claims and resolves them using
market-linked price infrastructure. Robinhood Chain's Stock Token direction supplies that
environment, so a narrative about real equities becomes a claim the chain can settle.

**5. Where is the AI?**

AI **compiles** a human narrative into a restricted, deterministic `ThesisSpec` (basket, weights,
benchmark, hurdle, duration) under a fail-closed validator. AI **never** determines settlement, and
it cannot supply feed addresses — those come from a deterministic registry. The oracle and the
math decide the winner.

**6. Why should this be trusted?**

Capital, specification, oracle settlement, and payout all live onchain. There is no proxy, no
upgradeability, no owner, no admin settlement, and no database. Anyone can call `resolve()`; the
math decides. Both documentation and the published evidence record the protocol's limits rather
than hiding them.

---

## Submission package checklist

| Item | Location |
|---|---|
| README (English-first) | [`README.md`](../README.md) |
| Security posture | [`SECURITY.md`](../SECURITY.md) |
| Final deployment + verification | [`DEPLOYMENTS_FINAL.md`](DEPLOYMENTS_FINAL.md) |
| Live E2E evidence | [`LIVE_E2E_FINAL.md`](LIVE_E2E_FINAL.md) |
| Verified feeds + cadence | [`TESTNET_ASSETS.md`](TESTNET_ASSETS.md) |
| Superseded deployments | [`DEPLOYMENTS.md`](DEPLOYMENTS.md) |
| Demo video | linked in the submission form |
