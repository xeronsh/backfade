# Backfade

> Back the thesis. Fade the noise.

Backfade turns market narratives into bonded, benchmarked, and verifiable onchain theses.

## Architecture

```text
Browser ── HTTPS ──▶ Cloudflare Tunnel ──▶ Vite preview :4173
                                              ├── React frontend
                                              └── /v1 ──▶ FastAPI :8000

React ── RPC ──▶ Robinhood Chain Testnet 46630
                  └── contracts are the financial source of truth
```

- **Frontend:** React, Vite, strict TypeScript, Tailwind CSS v4, Base UI, Lucide, Sonner,
  React Hook Form/Zod, Motion, React Router, TanStack Query, RainbowKit, Wagmi, and Viem.
- **Backend:** FastAPI, Pydantic Settings, shared async HTTP client, structured logs, stable
  errors, and OpenAPI-generated TypeScript clients.
- **Contracts:** Existing Solidity deployments and financial semantics remain frozen. Foundry
  artifacts generate the frontend ABI; FastAPI OpenAPI generates the API client.
- **Boundaries:** No database, indexer, queue, microservice, backend custody, private keys, or
  authentication layer. Chain reads and writes remain the only financial authority.
- **Routes:** `/`, `/create`, `/market/:address`, and `/profile/:address` are lazy-loaded React
  routes.

## Documentation

| Topic | Canonical document |
|---|---|
| Runtime boundaries and codegen | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| UI tokens and components | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) |
| Wallet and transaction flow | [`docs/WEB3.md`](docs/WEB3.md) |
| Deployment addresses and verification | [`docs/DEPLOYMENTS.md`](docs/DEPLOYMENTS.md) |
| Live contract evidence and manual wallet path | [`docs/LIVE_E2E.md`](docs/LIVE_E2E.md) |
| Security posture and limitations | [`SECURITY.md`](SECURITY.md) |
| Roadmap and explicit scope cuts | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Submission navigation | [`docs/SUBMISSION.md`](docs/SUBMISSION.md) |
