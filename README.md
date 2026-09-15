# Backfade

> **Back the thesis. Fade the noise.**

Backfade turns market narratives into **bonded, benchmarked and verifiable onchain theses**.

Markets trade assets.
Communities trade narratives.

---

## The Problem

Anyone can post a market take.

Very few people can prove they were:

- early
- right
- and willing to risk capital

Backfade makes market opinions accountable.

## Core Mechanism

```text
Narrative
  ↓
Thesis Compiler
  ↓
Creator Conviction
  ↓
BACK / FADE
  ↓
Oracle Settlement
  ↓
Narrative Alpha
  ↓
Proof of Insight
```

A creator writes a view in natural language. The compiler turns it into a deterministic
specification. The creator bonds capital. The market takes the other side or joins. Expiry
resolves it from oracle prices, with no human deciding the winner.

## Narrative Alpha

Success is **relative**, not absolute:

```text
Narrative Alpha = Weighted Basket Return − Benchmark Return
```

Example: a thesis of **AMD 40% + PLTR 60%** benchmarked against **TSLA**.

| | Return |
|---|---|
| Basket | +8.2% |
| TSLA benchmark | +3.0% |
| **Narrative Alpha** | **+5.2%** |

BACK wins only when `Narrative Alpha >= hurdle`. A basket that rises but trails its benchmark
still loses — that is the point.

## Creator Conviction

A creator must bond capital behind every thesis, and the creator bond is automatically part of
the
BACK pool. Opinions are not free to publish. The creator has skin in the game.

## Why Robinhood Chain

Backfade turns narratives about real-world markets into onchain financial claims. Robinhood Chain
provides the natural environment for Stock Token-based market narratives and oracle-settled
relative performance.

Testnet honesty: this demo runs on **verified AggregatorV3-compatible seeded testnet feeds**, not
mainnet production feeds. See [Testnet oracle transparency](#testnet-oracle-transparency).

## Live Demo

| Service | URL |
|---|---|
| Frontend | `https://water-moderate-exec-significance.trycloudflare.com` |
| Thesis Compiler API | `https://phi-diameter-block-earliest.trycloudflare.com` |

Temporary development tunnel (Cloudflare Quick Tunnel). Runs locally, exposed publicly. No VPS,
no database. The chain is the source of truth.

## What It Looks Like

```text
Feed                      Market
┌──────────────────────┐  ┌──────────────────────────────────────┐
│ Thesis narratives    │  │ Narrative: AI infrastructure …       │
│ read from chain      │  │ BACK 80% / FADE 20%                  │
│ (Factory.marketAt)   │  │ Creator Conviction  $500             │
└──────────────────────┘  │ Narrative Alpha  +0.02%  →  FAILED   │
                          └──────────────────────────────────────┘
```

## Final Contracts

All on **Robinhood Chain Testnet** (Chain ID `46630`) and **source verified**.

| Contract | Address | Explorer |
|---|---|---|
| MockUSDG | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` | [verify](https://explorer.testnet.chain.robinhood.com/address/0x7ba735a381b9ffe700a8c92558659461b359ee9c) |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` | [verify](https://explorer.testnet.chain.robinhood.com/address/0x9db674834f4c060114cb53f21e179fc54f905342) |
| Demo ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` | [verify](https://explorer.testnet.chain.robinhood.com/address/0xbf496ef435c814c81864b5f337f23b63d4b26bb3) |

Superseded pre-hardening deployments are recorded in [`docs/DEPLOYMENTS.md`](docs/DEPLOYMENTS.md).

## Final Live E2E

The demo thesis settled **honestly** — the narrative did not clear its hurdle:

| | |
|---|---|
| Narrative Alpha | **−5 bps** |
| Hurdle | **+1000 bps** |
| Outcome | **FADE** |
| Winner payout | 1000 MockUSDG |
| Final market balance | **0** |

**No oracle result was fabricated.** BACK lost because the basket failed to beat its benchmark by
the required margin. Every transaction is onchain:
[`docs/LIVE_E2E_FINAL.md`](docs/LIVE_E2E_FINAL.md).

## Testnet Oracle Transparency

Feed cadence was measured from ~4,000 real testnet update transactions:

| Percentile | Gap |
|---|---|
| median | 36–52 sec |
| p90 | 0.75–5.0 min |
| p99 | 2.8–6.2 min |
| worst observed | 21.1 h (TSLA/GME history) |

**Important limitation:** testnet AggregatorV3 feeds do **not** expose `getRoundData` round
history, so a "first post-expiry round" cannot be cryptographically selected here. The shipped
fallback:

- pre-expiry oracle values are **rejected** (`OracleMath: pre-expiry price`)
- settlement is bounded to a **30 minute** window
- stale or dead feeds lead to **cancellation with a full refund**, never a stale-price settlement

This was verified against real testnet data:

```text
resolvesAt     = 1789439524
TSLA updatedAt = 1789439516   →  resolve() REVERTED: pre-expiry price
TSLA updatedAt = 1789439576   →  resolve() SUCCEEDED
```

## Architecture

```text
Browser ──HTTPS──▶ Cloudflare Tunnel ──▶ Vite preview :4173  (frontend)
                                     └─▶ FastAPI      :8000  (thesis compiler)

Frontend ──RPC──▶ Robinhood Chain Testnet 46630  (contracts)
```

No database, no indexer, no queue. Markets are read from `Factory.marketsLength()` /
`Factory.marketAt()` and contract events.

| Layer | Stack |
|---|---|
| Contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| Backend | Python 3.12+, FastAPI, Pydantic v2, httpx |
| Frontend | Vite, vanilla TypeScript, TailwindCSS, viem, EIP-1193 |
| Chain | Robinhood Chain Testnet, ID 46630 |

## Testing

```bash
cd contracts
forge test
```

| Gate | Result |
|---|---|
| Solidity tests | **71 passed** |
| Fuzz | 7 suites × 256 runs |
| Invariant | 7 suites × 2048 calls |
| Frontend types | `npx tsc --noEmit` |
| Frontend build | `npm run build` |
| API selfcheck | `uv run python selfcheck.py` |
| ABI parity | `python3 scripts/abi_parity.py` |

## Security

No proxy, no upgradeability, no owner-controlled settlement, permissionless resolve,
deterministic payout. This is **hackathon testnet software** and has not received a professional
security audit. See [`SECURITY.md`](SECURITY.md).

## Local Development

```bash
# contracts
cd contracts && forge build && forge test

# backend
cd api && uv run uvicorn api.main:app --host 127.0.0.1 --port 8000

# frontend
cd web && npm install && npm run build && npx vite preview --host 127.0.0.1 --port 4173
```

## Tunnel Development

```bash
cloudflared tunnel --url http://127.0.0.1:4173   # frontend
cloudflared tunnel --url http://127.0.0.1:8000   # API
```

Then rebuild the frontend with `VITE_API_BASE=<api tunnel url>` and allow that origin via
`BACKFADE_CORS_ORIGINS`.

## Documentation

| Doc | Contents |
|---|---|
| [`SECURITY.md`](SECURITY.md) | Trust assumptions, oracle limits, testnet caveats |
| [`docs/SUBMISSION.md`](docs/SUBMISSION.md) | Evaluator navigation page |
| [`docs/DEPLOYMENTS_FINAL.md`](docs/DEPLOYMENTS_FINAL.md) | Final deployment + verification record |
| [`docs/LIVE_E2E_FINAL.md`](docs/LIVE_E2E_FINAL.md) | Full live E2E evidence and recomputation |
| [`docs/TESTNET_ASSETS.md`](docs/TESTNET_ASSETS.md) | Verified feeds + measured cadence |

## Roadmap

- Named Cloudflare tunnel or stable hosting for a permanent demo URL
- Production mainnet Stock Token feeds instead of testnet seeded feeds
- Additional thesis primitives beyond weighted-basket excess return

## License

MIT
