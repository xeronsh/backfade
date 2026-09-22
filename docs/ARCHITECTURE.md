# Architecture

Backfade keeps financial truth onchain and keeps social presentation in the client. The product is a social feed for capital-backed investment opinions; the protocol is an immutable Thesis/Challenge lifecycle.

## Runtime

```text
Browser
  ├── React/Vite app
  ├── Robinhood Chain Testnet RPC → ThesisFactory → ThesisChallenge
  └── same-origin /v1 → FastAPI compiler

Wallet → RainbowKit → Wagmi/Viem → simulate → sign → receipt → invalidate
```

The API structures narrative input and serves the enabled asset registry. It never signs, settles, holds collateral, authenticates users, or stores canonical social/financial state.

## Frontend ownership

- React Router owns `/`, `/post`, `/thesis/:address`, `/leaderboard`, and `/profile/:address`; legacy `/create` and `/market/:address` redirect.
- Wagmi + Viem own wallet state, chain reads, simulations, writes, receipts, and event reads.
- TanStack Query caches Factory/Thesis reads and invalidates after every successful receipt.
- React Hook Form + Zod own post validation; local React state owns Reference confirmation and local UI state.
- `web/src/features/thesis/` owns chain reads, domain types, bigint stats, and leaderboard aggregation.
- `web/src/components/backfade/` owns Thesis posts, compiler preview, Challenge composer, activity, and settlement presentation.
- No Redux, Zustand, Jotai, database, indexer, queue, or Follow graph is introduced.

The client derives the social activity tape from `ThesisCreated`, `ConvictionRaised`, `ChallengePosted`, `ThesisSettled`, `ThesisCancelled`, and `Claimed` events. Factory Thesis addresses and contract fields are read with multicall. A read failure is surfaced rather than filled with guessed financial data.

## Contract boundary

`ThesisFactory` is deployment-configured once through its constructor with canonical collateral, approved feeds, challenge window, horizon, settlement window, and start-price age. It has no owner, setter, proxy, governance, or upgrade path. It validates basket weights and deploys `ThesisChallenge` instances.

`ThesisChallenge` owns immutable narrative/reference/basket/start prices, creator bond, Challenge Pool, Open Bounty, Matched Conviction, Alpha, payout pools, pull claims, and lifecycle state. It does not store profiles, likes, followers, ranking, or free comments.

The v0.1 `ThesisMarket` and legacy factory source remain under the historical artifact path for reproducibility only. They are not used by v0.2 Factory, routes, or generated primary ABI.

## Backend boundary

`POST /v1/thesis/compile` returns `ThesisSpecV2`:

```text
narrative
basket[{symbol, feed, weight_bps}]
reference{symbol, feed}
reference_origin: explicit | suggested
```

Feeds are always re-anchored from `api/data/assets.json`. When text explicitly names a comparison, the compiler marks `explicit`; otherwise it marks `suggested`. The UI must confirm the Reference before calling the Factory.

## Code generation

```text
Foundry source ──forge inspect──▶ web/src/generated/contracts.ts
FastAPI app ──OpenAPI export──▶ api/openapi.json ──Orval──▶ web/src/lib/api/generated/
```

Generated files are not hand-edited. `make codegen` regenerates both surfaces and `make check` verifies parity.

## Deployment data

Current v0.2 addresses and configuration are recorded in [`DEPLOYMENTS.md`](DEPLOYMENTS.md). The previous v0.1 addresses are retained there as historical records and are never overwritten by v0.2 configuration.
