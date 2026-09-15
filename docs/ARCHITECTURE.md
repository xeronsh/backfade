# Architecture

Backfade is a static React application with a small compiler API. Generic complexity belongs to
mature infrastructure; Backfade-specific meaning stays in domain components and contract flows.

## Runtime

```text
Browser
  ├── React/Vite static app
  ├── Robinhood Chain Testnet RPC → contracts (canonical financial state)
  └── same-origin /v1 → FastAPI compiler

Cloudflare Tunnel → Vite preview → /v1 proxy → FastAPI
```

The API compiles narratives and serves the enabled asset registry. It does not sign transactions,
hold keys, settle markets, or store canonical market data.

## Frontend boundaries

- React Router owns route state: Feed, Create Thesis, Market Detail, and Creator Profile.
- RainbowKit owns wallet discovery and connection UX.
- Wagmi + Viem own wallet/chain reads and writes.
- TanStack Query owns API and blockchain read caching.
- React Hook Form + Zod own complex form state and client validation.
- `components/ui` stays generic. `components/backfade` owns Thesis, Conviction, Narrative Alpha,
  Position, and market lifecycle semantics.
- All writes follow simulate → wallet signature → receipt → query invalidation.

## Backend boundaries

FastAPI has routers, services, schemas, and core configuration only. `pydantic-settings` owns
runtime configuration. A lifespan-owned `httpx.AsyncClient` provides connection pooling for the
single structured compiler call. Development can use the deterministic mock compiler; production
requires an LLM key.

Stable endpoints:

- `POST /v1/thesis/compile`
- `GET /v1/assets`
- `GET /health`

## Source of truth

The chain is the canonical financial state. Query cache is ephemeral and may be discarded at any
time. There is no database, indexer, queue, authentication layer, or backend wallet.
Deployment values are canonical in [`DEPLOYMENTS.md`](DEPLOYMENTS.md); contract source is frozen.

## Code generation

```text
Foundry artifacts ──forge inspect──▶ web/src/generated/contracts.ts
FastAPI app ──OpenAPI export──▶ api/openapi.json ──Orval──▶ web/src/lib/api/generated/
```

Generated output is marked `AUTO-GENERATED — DO NOT EDIT` or Orval's equivalent. CI regenerates
both surfaces and fails when the committed output drifts.

## Performance and accessibility

Routes are lazy loaded. Factory market addresses and market fields are read through multicall.
Delayed reads show skeletons; failed reads explain the problem and the available action. BACK and
FADE always have text labels, financial values use tabular numerals, and reduced motion removes
nonessential animation.
