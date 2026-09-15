# Backfade — Submission

> **Back the thesis. Fade the noise.**

Backfade turns market narratives into **bonded, benchmarked and verifiable onchain theses**.

Markets trade assets. Communities trade narratives.

---

## Live demo

The demo runs the production build locally and exposes it through **one** Cloudflare Tunnel.
`vite preview` proxies `/v1` to FastAPI, so the browser sees a single origin with no CORS.

```bash
cd api && uv run uvicorn api.main:app --host 127.0.0.1 --port 8000 &
cd web && npm run build && npx vite preview --host 127.0.0.1 --port 4173 &
cloudflared tunnel --url http://127.0.0.1:4173 --protocol http2
```

The public hostname is printed by `cloudflared` at startup and changes on every restart, so it is
read from the terminal rather than pinned here. No VPS is involved: the app runs on a laptop and
the tunnel gives it a public HTTPS origin.

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
| MockUSDG (testnet collateral) | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` | ✅ | [link](https://explorer.testnet.chain.robinhood.com/address/0x7ba735a381b9ffe700a8c92558659461b359ee9c) |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` | ✅ | [link](https://explorer.testnet.chain.robinhood.com/address/0x9db674834f4c060114cb53f21e179fc54f905342) |
| Demo ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` | ✅ | [link](https://explorer.testnet.chain.robinhood.com/address/0xbf496ef435c814c81864b5f337f23b63d4b26bb3) |

Full deployment record: `docs/DEPLOYMENTS.md`.

## Demo thesis

| Field | Value |
|---|---|
| Narrative | AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark. |
| Basket | AMD 60% + PLTR 40% |
| Benchmark | TSLA |
| Hurdle | +10% |
| Outcome | **FADE** — Narrative Alpha settled at **−5 bps**, far below the hurdle |

The narrative did not clear its hurdle and BACK lost. No oracle value was fabricated to produce
a prettier demo. Full transaction and recomputation trail: `docs/LIVE_E2E.md`.

## Transactions

| Step | Tx |
|---|---|
| Create market (creator bond 500, BACK) | `0x5bb5104d1faa8952b0c29464e18d0f1e0114943787420a0292babd87c3182754` |
| Trader BACK 300 | `0xf26b7cd27478804cce9715789c4dd16c1e9044d2d272b5433f40ff75c384e51b` |
| Trader FADE 200 | `0x288cb19639ba5d0eeebb8b36e36b2c2e981e34fe8837ba0b073295e4cb2b14fb` |
| Resolve | `0x47f0d2d4d0dffe73e434d6c548ce6136a5cd92f8d74c7facae71ee2b2024a858` |
| Winner claim | `0x973438d3a164df0624f0c039976a9cad868b39c33d2721b8ca3ecfa0dadc825f` |

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
expiry (resolvesAt)   = 1789449886
TSLA updatedAt        = 1789449885  ->  resolve() REVERTED: pre-expiry price
TSLA updatedAt        = 1789449956  ->  resolve() SUCCEEDED
```

Separately, the cancellation fallback was exercised end to end: past the settlement window
`resolve()` reverts `SettlementWindowPassed`, `cancelAfterDeadline()` opens refunds, and every
participant recovers their own stake exactly (market balance 200 → 0).

A pre-expiry price cannot settle a market.

## Testing

| Gate | Result |
|---|---|
| `forge test` | **71 passed / 0 failed** |
| Fuzz | 7 suites × 256 runs |
| Invariant | 7 suites × 2048 calls |
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

## Submission package checklist

| Item | Location |
|---|---|
| README (English-first) | [`README.md`](../README.md) |
| Security posture | [`SECURITY.md`](../SECURITY.md) |
| Final deployment + verification | [`DEPLOYMENTS.md`](DEPLOYMENTS.md) |
| Live E2E evidence | [`LIVE_E2E.md`](LIVE_E2E.md) |
| Verified feeds + cadence | [`TESTNET_ASSETS.md`](TESTNET_ASSETS.md) |
| Cancellation + refund evidence | [`LIVE_E2E.md`](LIVE_E2E.md#cancellation-and-refund) |
| Pitch notes | [`PITCH.md`](PITCH.md) |
| Demo video | linked in the submission form |
