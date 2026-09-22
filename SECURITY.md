# Security

Backfade v0.2 is testnet software and has not received a professional security audit. Do not use production capital or production keys.

## Trust model

| Property | v0.2 behavior |
|---|---|
| Upgradeability | None; no proxy, delegatecall, or storage gap |
| Privileged protocol role | None after Factory deployment configuration |
| Settlement authority | Permissionless; deterministic oracle guards and math |
| Collateral | One canonical deployment-configured ERC20 |
| Feeds | Deployment allowlist only; no user-supplied feed address |
| Creator control | Bond and raise Conviction during the open window; no withdrawal or reduction |
| Challenger control | Challenge with positive amount and non-empty note, capped by Open Bounty |
| Financial state | Onchain ThesisChallenge contract |
| Offchain state | No database, indexer, queue, custody, or auth |

The v0.1 binary contracts and addresses remain historical evidence only. The v0.2 Factory does not reuse their semantics or addresses.

## Contract protections

- Basket weights must sum to 10,000 bps, use one to five distinct approved feeds, and exclude the Reference.
- Creator Bond is the only original conviction. `challengePool <= creatorBond` and `openBounty = creatorBond - challengePool` are enforced.
- The creator cannot Challenge their own Thesis. Notes are plain UTF-8 text capped at 280 bytes.
- The Thesis narrative is separate from the Bet and capped at 2,000 bytes. It is stored as written and never parsed into the payout terms.
- The chosen horizon must be in the deployment's allowlist, and the chosen payout range must sit inside the deployment's bounds. Neither can be edited after creation.
- Narrative, basket, Reference, and normalized start prices cannot be edited after creation.
- Start prices require a positive answer, valid timestamp, deployed feed code, and configured freshness.
- Settlement requires every feed observation to be positive, non-future, at or after expiry, and inside the bounded settlement window.
- If the safe window expires, anyone can cancel and every participant pulls principal back; no fabricated result is used.
- `ReentrancyGuard` protects token-moving writes. `SafeERC20` protects collateral transfers.
- Claims are pull-based and `claimed[address]` blocks double claims.
- No fee, treasury, sweep, borrowing, leverage, AMM, order book, or liquidation path exists.

## Payout invariant

The actual signed Narrative Alpha is stored without a cap. Only the transfer is bounded to ±1,000 bps:

```text
transfer = challengePool × min(abs(realizedAlphaBps), 1000) / 1000
```

The settled pools conserve collateral:

```text
creatorPayout + challengePayoutPool = creatorBond + challengePool
```

Individual Challenger claims use floor division. The aggregate can leave only documented integer-token dust. No administrative sweep hides a discrepancy.

## Oracle assumptions

Feeds must implement Chainlink-style `latestRoundData()` and `decimals()`. The protocol trusts the deployment allowlist and the feed publisher's data. It does not treat the Reference as an academically correct benchmark; it is the comparison named by the Thesis.

The current Robinhood Chain Testnet registry is equity-heavy. Unsupported crypto feeds are not invented to satisfy product copy. Crypto production examples remain disabled until reliable verified feeds and registry parity exist.

## Wallet and application boundary

- Private keys stay in ignored local environment files and are never written to source, logs, generated bundles, or docs.
- `VITE_*` values are public chain configuration only.
- The API compiles text and re-anchors feeds; it has no signer, custody, database, social graph, or auth layer.
- Challenge notes are rendered as plain text. Links, scripts, and HTML embedded in notes are not executed.
- Leaderboard identity is Sybil-able; matched capital, resolved count, and counterparties provide context but do not prove a human identity.

## Testing posture

Contract tests cover creation, bonding, feed/collateral allowlisting, Challenge caps, notes, raises, lifecycle boundaries, positive/negative/zero/out-of-range Alpha, cancellation, claims, pro-rata rounding, fuzz conservation, and the Challenge Pool invariant. API and frontend tests cover Reference confirmation, capital-backed Challenge requirements, bigint aggregation, profile history, and leaderboard splits.
