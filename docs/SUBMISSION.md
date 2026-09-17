# Backfade v0.2 — Submission

> If you call it, bond it. If you doubt it, Fade it.

Backfade turns narrative opinions into capital-backed Thesis/Challenge threads. The chain owns collateral, oracle settlement, claims, and lifecycle state; the browser renders the social surface.

## Live demo

```bash
make dev
# optional same-origin tunnel
cloudflared tunnel --url http://127.0.0.1:5173 --protocol http2
```

The frontend uses the local FastAPI compiler through the Vite `/v1` proxy. Wallet writes go directly to Robinhood Chain Testnet.

## Network and contracts

| Field | Value |
|---|---|
| Network | Robinhood Chain Testnet |
| Chain ID | `46630` |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Factory | `0x49a9CF7661aAB5B658A5c19420993Fcf00841d2a` |
| Collateral | `0x222903b08139FeeF6C0CAD921e0f2F7f5Eb81AB6` |

All addresses and configuration are canonical in [`DEPLOYMENTS.md`](DEPLOYMENTS.md). The v0.1 binary deployment remains historical and is not reused.

## Product loop

```text
POST → BOND → FADE → SETTLE → BUILD TRACK RECORD
```

- `/` — Thesis feed
- `/post` — compiler preview, explicit Reference confirmation, Conviction, Bond & Post
- `/thesis/:address` — Thesis thread, Alpha, Challenges, capital, settlement, claims
- `/profile/:address` — chain-derived history
- `/leaderboard` — realized P&L discovery

There are no free comments, generic Back positions, probability/odds UI, binary outcomes, fees, rewards, or identity claims.

## Live testnet evidence

The fresh deployment created Thesis `0x1Ba1F165d3823188500e47C5fE9c41aBC88F3b30` with a `1,000 USDG` creator bond. Two Challengers posted `300 USDG` and `200 USDG` notes. The registry feeds did not publish a safe post-expiry observation, so the Thesis was cancelled rather than settled on stale data. All three principal claims succeeded and the final contract balance was `0 USDG`.

The complete testnet transaction table is [`LIVE_E2E.md`](LIVE_E2E.md), including `ThesisCreated`, `ChallengePosted`, `ThesisCancelled`, and `Claimed` evidence. The same document records the successful wallet-backed local `ThesisSettled`/`Claimed` E2E; a successful live testnet settlement is not claimed until the allowlisted feeds resume and produce post-expiry observations.

## Verification

```bash
make test
make check
make e2e
```

`make test` covers 91 contract tests, API checks, frontend tests, and a production build. `make e2e` covers the social browser flow in Chromium and Firefox. Contract settlement/claim behavior is additionally covered by deterministic, fuzz, and invariant tests; the external feed outage is documented rather than hidden.

## Trust boundaries

- `ThesisFactory` fixes canonical collateral, approved feeds, timings, and immutable Thesis creation.
- `ThesisChallenge` stores narrative, Reference, basket/start prices, Conviction, Challenges, Alpha, payout pools, claims, and lifecycle.
- FastAPI only structures text and re-anchors symbols to the checked-in enabled registry.
- Wagmi/Viem reads chain data and submits simulated, wallet-signed writes.
- Profiles and leaderboard data aggregate directly from Factory/Thesis reads and events; no database or indexer is used.

See [`ARCHITECTURE.md`](ARCHITECTURE.md), [`MECHANISM.md`](MECHANISM.md), and [`SECURITY.md`](../SECURITY.md).
