# Backfade v0.1

A social market for investment narratives. Per `BACKFADE_GOAL.md`.

## Layout

```
api/       Thesis Compiler (FastAPI, uv)
contracts/ Foundry contracts (ThesisFactory, ThesisMarket, OracleMath, MockUSDG)
web/       Vite vanilla-TS frontend (4 pages, viem, no framework)
```

## Contracts

```bash
cd contracts
forge test                      # 27 tests incl. fuzz + invariant
anvil &                         # local chain
forge script script/DemoCreate.s.sol --fork-url http://localhost:8545 --broadcast
# advance time past resolvesAt (betting 10min, resolve 20min):
cast rpc evm_setNextBlockTimestamp $(($(cast block latest -f timestamp) + 1300)) && cast rpc evm_mine
forge script script/DemoResolve.s.sol --fork-url http://localhost:8545 --broadcast
```

Full loop prints: create -> back -> fade -> prices -> resolve (BACK wins) -> claim payout.

Deployment to any chain: `DEPLOYER_KEY=0x… forge script script/Deploy.s.sol --rpc-url <url> --broadcast`
(deploys MockUSDG + 4 mock feeds + ThesisFactory; real testnet feed addresses need
verification before use per spec §6.9).

## Compiler API

```bash
cd api
uv run uvicorn api.main:app --port 8000
uv run python selfcheck.py      # validator + mock compile + live endpoint checks
```

- `POST /v1/thesis/compile` — natural language -> validated ThesisSpec
- `GET  /v1/assets` — supported asset universe (from `api/data/assets.json`)
- `GET  /health`

LLM: set `BACKFADE_LLM_API_KEY` (+ optional `BACKFADE_LLM_BASE_URL`, `BACKFADE_LLM_MODEL`)
in `.env` for the OpenAI-compatible structured-output client. No key -> deterministic
mock compiler so the demo never breaks. Feed addresses always come from the backend
mapping, never from LLM output. Validation is fail-closed.

## Web

```bash
cd web
npm install
npm run build       # multi-page: index/create/market/profile
npm run dev         # dev server, proxies /v1 -> localhost:8000
```

Configure chain + contracts via env: `VITE_CHAIN_ID`, `VITE_RPC_URL`,
`VITE_FACTORY_ADDRESS`, `VITE_COLLATERAL_ADDRESS`, `VITE_API_BASE`.
Create page: compile -> inspect every field -> conviction -> launch.
Market page: BACK/FADE with allowance-aware tx flow, resolve, claim.

## Not in v0.1

Everything in spec §3.2 (no DB, no indexer, no secondary trading, no comments/DMs).
Testnet deployment intentionally not performed.
