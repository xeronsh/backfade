# Roadmap

Backfade v0.2 proves the narrow loop:

```text
POST → BOND → FADE → SETTLE → BUILD TRACK RECORD
```

## v0.2 shipped surface

- Relative Thesis with a creator bond and explicit Reference confirmation.
- Capital-backed Challenges with plain text notes and Open Bounty cap.
- Continuous bounded transfer driven by realized Narrative Alpha.
- Immutable onchain lifecycle: `OPEN`, `LOCKED`, `SETTLED`, `CANCELLED`.
- Social feed, Thesis thread, profile history, and P&L leaderboard.
- Client-side aggregation from Factory data and events; no indexer at current scale.

## Deliberately deferred

- Follow graph, notifications, bookmarks, reposts, quote Fades, DMs, search, and recommendations.
- Database/indexer; add only after measured RPC latency becomes unacceptable at hundreds/thousands of Theses.
- Protocol fees, treasury, governance, tokens, points, airdrops, and rank rewards.
- Mainnet, embedded wallets, leverage, borrowing, liquidation, AMM, order book, secondary positions, and market-implied Alpha.
- AI trading-agent infrastructure. Normal agent wallets may use the same primitives later.
- Optional Share to X distribution action after the core loop is stable.

## Feed gate

The protocol is asset-agnostic, but the production product is crypto-first only when verified reliable crypto feeds, allowlist deployment, and API/frontend registry parity exist. Until then, verified testnet feeds prove the mechanism without pretending unsupported assets are available.
