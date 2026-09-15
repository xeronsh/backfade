# Platform Baseline

This is the migration baseline for Platform Engineering.

| Item | Baseline |
|---|---|
| Git ref | `d0294e7` |
| Working tree | Clean at migration start |
| Contracts | `contracts/src/` read-only; no Solidity changes in this migration |
| Frontend | Vanilla TypeScript entrypoints in `web/index.html`, `create.html`, `market.html`, and `profile.html` |
| Frontend state | Direct EIP-1193 access, handwritten ABI, page-local RPC reads and writes |
| Backend | FastAPI compiler, asset registry, and health endpoint under `api/api/` |
| API compatibility | `POST /v1/thesis/compile`, `GET /v1/assets`, `GET /health` |
| Deployment source | [`DEPLOYMENTS.md`](DEPLOYMENTS.md) |
| Live protocol evidence | [`LIVE_E2E.md`](LIVE_E2E.md) |
| CI baseline | `.github/workflows/ci.yml` at `d0294e7` |

The migration preserves the deployed contracts, addresses, settlement semantics, and product
vocabulary. Visual comparison is performed against the canonical routes after the React shell and
browser smoke suite are available; no user or wallet secret is stored in baseline artifacts.
