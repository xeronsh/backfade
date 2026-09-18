# Backfade

Crypto calls with skin in the game.

If you call it, bond it.
If you doubt it, fade it.

Backfade turns crypto opinions into capital-backed social challenges. Creators bond a Thesis, Challengers put money behind disagreement, and verified price feeds settle the argument. Wins and losses stay on the track record.

## v0.2 Social Alpha

- **Network:** Robinhood Chain Testnet (`46630`)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS v4
- **Backend:** FastAPI compiler returning `ThesisSpecV2`
- **Contracts:** Foundry Solidity; `ThesisFactory` deploys immutable `ThesisChallenge` instances
- **Collateral:** deployment-configured MockUSDG on testnet only; no real value
- **Feeds:** only the deployment allowlist is accepted. The current registry is equity-heavy until reliable verified crypto feeds are available.

The chain owns narrative commitments, collateral, oracle settlement, claims, and lifecycle state. The API only structures narrative input and re-anchors feeds from the checked-in registry. The browser wallet signs every write; there is no custody, database, indexer, or social graph.

## Product loop

```text
POST → BOND → FADE → SETTLE → BUILD TRACK RECORD
```

The primary objects are people, Thesis posts, Challenges, and realized financial history. A Challenge always contains plain text plus capital. There are no free replies, generic Back positions, odds, binary outcomes, or rank rewards.

## Run locally

Prerequisites: Node.js/npm, Python 3.12+, [`uv`](https://docs.astral.sh/uv/), and [Foundry](https://book.getfoundry.sh/getting-started/installation).

```bash
make dev       # FastAPI :8000 + Vite :5173
make api       # API only
make web       # frontend only
```

Development without an LLM key uses the deterministic compiler fallback. Never commit `.env` files, private keys, or wallet credentials.

## Verification

```bash
make test      # contracts + API + frontend tests
make check     # codegen, format/lint/type/build, ABI parity, secret scan
make e2e       # Playwright browser flow
make live-check # verify documented live cancellation/refunds and claims
```

`make check` regenerates `web/src/generated/contracts.ts`, `api/openapi.json`, and Orval output, then fails if committed generated artifacts drift.

## Routes

- `/` — single-column Thesis feed
- `/post` — narrative, Reference confirmation, Conviction, Bond & Post
- `/thesis/:address` — Thesis thread, Alpha, Challenges, capital tape, settlement, claims
- `/leaderboard` — Overall, Creators, and Faders ranked by realized net P&L
- `/profile/:address` — immutable Thesis and Challenge track record
- `/create` and `/market/:address` — legacy redirects

## Documentation

| Topic | Document |
|---|---|
| Financial semantics and formulas | [`docs/MECHANISM.md`](docs/MECHANISM.md) |
| Runtime boundaries and code generation | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| UI tokens and interaction rules | [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) |
| Wallet and transaction flow | [`docs/WEB3.md`](docs/WEB3.md) |
| v0.2 deployment and preserved v0.1 history | [`docs/DEPLOYMENTS.md`](docs/DEPLOYMENTS.md) |
| Live deployment evidence | [`docs/LIVE_E2E.md`](docs/LIVE_E2E.md) |
| Verified testnet asset registry | [`docs/TESTNET_ASSETS.md`](docs/TESTNET_ASSETS.md) |
| Deferred product work | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Security assumptions | [`SECURITY.md`](SECURITY.md) |

## Version boundary

`v0.1-binary` points to `556fcabe91221b9ff348f9e8ffd4d31f9a570549`. v0.2 work lives on `v0.2-social-alpha`. Historical v0.1 deployment addresses and semantics remain documented; they are not silently reused as v0.2 contracts.
