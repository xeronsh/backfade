# Backfade

> Back the thesis. Fade the noise.

Backfade turns market narratives into bonded, benchmarked, verifiable onchain `thesis` positions.
The chain owns market state and settlement; the API only compiles narratives into validated
`ThesisSpec` data.

## Status and scope

- **Network:** Robinhood Chain Testnet (`46630`)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** FastAPI compiler and asset registry
- **Contracts:** Foundry Solidity contracts; deployed addresses are in [`docs/DEPLOYMENTS.md`](docs/DEPLOYMENTS.md)
- **Current scope:** testnet demo only; MockUSDG has no real value
- **Explicitly absent:** database, indexer, queue, backend wallet custody, authentication, and secondary trading

Settlement, balances, oracle observations, and payouts are read from the contracts. The backend
never signs transactions or stores canonical market state.

## Architecture

```text
Browser ──▶ React/Vite ──▶ Robinhood Chain Testnet RPC
    │              └──────▶ /v1 ──▶ FastAPI compiler
    └────────────── wallet signature via RainbowKit/Wagmi
```

- `web/` owns routes, wallet UX, chain reads/writes, and generated clients.
- `api/` owns narrative compilation, the asset registry, validation, and health endpoints.
- `contracts/` owns financial semantics and settlement rules.
- `scripts/` owns code generation and parity checks.
- `docs/` contains current architecture, design, deployment, and live-evidence records.

## Prerequisites

Install:

- Node.js and npm
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

Dependencies are already pinned by `web/package-lock.json`, `api/uv.lock`, and Foundry's checked-in
libraries.

## Run locally

The Makefile supplies the public testnet defaults used by the demo:

```bash
make dev
```

This starts:

- FastAPI at `http://127.0.0.1:8000`
- Vite at `http://127.0.0.1:5173`
- same-origin proxy routes for `/v1` and `/health`

For an LLM-backed compiler, copy `api/.env.example` to `api/.env` and set
`BACKFADE_LLM_API_KEY`. Development without a key uses the deterministic mock compiler.
Never commit `.env` files, private keys, or wallet credentials.

Run services separately when needed:

```bash
make api       # API only
make web       # frontend only
```

## Verification

Run the full local gates from the repository root:

```bash
make test       # contracts + API + frontend checks
make check      # code generation parity + all checks + ABI parity + secret scan
make e2e        # Playwright Chromium and Firefox smoke tests
```

Individual checks:

```bash
make contracts
make api-check
make web-check
python3 scripts/abi_parity.py
```

`make check` regenerates contract/OpenAPI clients and fails if committed generated output drifts.
The browser suite uses deterministic RPC fixtures and does not require a wallet extension.

## Key routes

- `/` — market Feed
- `/create` — compile and launch a thesis
- `/market/:address` — market detail, evidence, Position panel, and lifecycle actions
- `/profile/:address` — creator facts read from chain

## Documentation

| Topic | Document |
|---|---|
| Runtime boundaries and code generation | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| UI tokens and interaction rules | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) |
| Wallet and transaction flow | [`docs/WEB3.md`](docs/WEB3.md) |
| Deployment addresses and verification | [`docs/DEPLOYMENTS.md`](docs/DEPLOYMENTS.md) |
| Live contract evidence and limitations | [`docs/LIVE_E2E.md`](docs/LIVE_E2E.md) |
| Verified testnet feeds | [`docs/TESTNET_ASSETS.md`](docs/TESTNET_ASSETS.md) |
| Product scope and deferred work | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Architecture decisions | [`docs/adr/`](docs/adr/) |
| Security posture | [`SECURITY.md`](SECURITY.md) |

## Security

This repository targets a testnet. Do not use real funds or production credentials. Read
[`SECURITY.md`](SECURITY.md) before deploying or connecting a wallet.
