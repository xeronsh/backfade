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
| Factory | `0x1531218CA9e05fDA3065FD2BDfeBD4F44036ba09` |
| Collateral | `0x84C5f600720532f71009dd2cBED168e766383eE8` |

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

The earlier fresh deployment created Thesis `0x1Ba1F165d3823188500e47C5fE9c41aBC88F3b30` with a `1,000 USDG` creator bond and was safely cancelled when the registry feeds did not publish a post-expiry observation. Thesis `0x914345586A1fb1598BFB371DA5cca53614ff91C7` then demonstrated the same live Creator → two Challenger flow with `1,000 USDG`, `300 USDG`, and `200 USDG`; it was safely cancelled, all three claims completed, and the final balance was zero. The revised evidence scope pairs this live cancellation with the successful wallet-backed local settlement flow documented in [`LIVE_E2E.md`](LIVE_E2E.md).

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
