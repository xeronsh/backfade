# Security

Backfade is **hackathon testnet software** and has **not received a professional security
audit**. It must not be used with production capital. This document states the actual trust
assumptions rather than implying stronger ones.

## At a glance

| Property | Status |
|---|---|
| Proxy / upgradeability | **No proxy. No upgradeability.** |
| Owner-controlled settlement | **None.** No `owner`, no `admin`, no pause, no sweep. |
| Settlement authority | **Permissionless `resolve()`**, deterministic payout |
| Pre-expiry oracle values | **Rejected** (`OracleMath: pre-expiry price`) |
| Start-price freshness | **Enforced** (`maxStartAge`, default 30 min, cap 24 h) |
| Settlement window | **Bounded** per market (default 30 min, bounds 15 min–24 h) |
| Dead / stale feeds | **Cancellation + full refund**, never a stale-price settlement |
| Empty winning pool | **Cancellation + full refund** (no stranded collateral) |
| Database / indexer | **None.** Chain is the source of truth. |
| Custody | **None.** Contracts hold only market collateral, claimable by participants. |
| Mainnet deployment | **None.** Testnet only (chain 46630). |
| MockUSDG | **No real-world value.** Permissionless mint exists for testnet only. |
| Testnet feeds | Seeded AggregatorV3-compatible; **not** mainnet production feeds. |

## Contract posture

| Property | Status |
|---|---|
| Proxy / upgradeability | **None.** `ThesisMarket` is deployed immutable with no delegatecall and no storage gaps. |
| Privileged roles | **None.** No `owner`, no `admin`, no pause, no sweep. `grep -rniE "onlyOwner\|admin\|setOutcome\|upgradeTo" contracts/src/` returns nothing. |
| Admin settlement | **None.** No trusted resolver, no creator override, no way to rewrite an outcome. |
| Settlement authority | **Deterministic math only.** `resolve()` is permissionless and takes no argument. |
| Creator powers | Only creating a market and bonding capital. A creator cannot resolve, cancel, or alter a market. |

## Payout math

Pari-mutuel, floor division:

```
payout = stake * totalPool / winningPool        // totalPool = backPool + fadePool
```

- A single winner receives the entire pool and the market drains to exactly **0**.
- With multiple winners each payout floors, so at most **one wei per winner** can remain. The
  invariant `marketBalance <= number of unclaimed winners` is tested (see `test_RoundingDustIsBoundedByWinnerCount`
  and `invariant_FullyClaimedMarketIsEmpty`).
- Rounding dust is bounded and expected. There is **no admin sweep** to paper over a math error.
- The creator bond is an ordinary BACK position and only the creator can claim it.
- Losing positions can never claim; double claims revert (`NothingToClaim`).
- If a market settles in favour of a side that never received a single stake, the winning pool is
  empty and pro-rata payout would divide by zero. Settlement therefore falls back to
  `Cancelled` and every participant takes back their own stake, so no collateral can be stranded.
  This is enforced by `invariant_SettledMarketIsAlwaysPayable` and
  `test_NoOpposingCapitalAndThesisFailsRefundsEveryStake`.

## Oracle assumptions

- Feeds are AggregatorV3-compatible. Every read requires: contract code present, `answer > 0`,
  `updatedAt > 0`, and valid `decimals`.
- **`getRoundData()` is not implemented on the testnet feeds.** The selector `0x9a6fc8f5` is absent
  from every feed's bytecode and all calls revert with empty data. Selecting a specific round after
  expiry is therefore not implementable here; the protocol knowingly uses the latest observation
  inside the window instead.
- Testnet feeds are **seeded feeds** (prices pushed via `setAnswer`), maintained by the testnet
  ecosystem. They are **not** official mainnet Chainlink Stock Token proxies. The production path
  would use those mainnet feeds.
- Measured cadence (4000 updates per feed): median gap 36–52 s, p90 0.75–5.0 min, p99 2.8–6.2 min.
  A **21.1 hour outage** appears in the TSLA and GME history.

## Settlement semantics

For every feed, the end price must satisfy:

```
resolvesAt <= updatedAt <= resolvesAt + settlementWindow
```

- `updatedAt < resolvesAt` → **reverted** (`OracleMath: pre-expiry price`). A price observed before
  expiry can never settle a market.
- `updatedAt > resolvesAt + settlementWindow` → rejected; past the window the market can only be
  cancelled.
- The first caller supplying a fully legal observation set freezes the outcome
  (`AlreadyResolved`); later prints cannot re-open it.

### Known limitation — bounded timing discretion

`settlementWindow` is a per-market immutable (default **30 minutes**, bounds 15 minutes to 24
hours). Because settlement uses the latest observation *inside* that window, a resolver retains
**bounded** discretion over which legal print is used: they may wait within the 30 minutes for a
more favourable value. They cannot reach backwards before expiry, cannot exceed the window, and
cannot change the outcome once set.

30 minutes is ~4.9× the worst observed p99 gap, so a normal feed hiccup cannot force a cancel,
while being ~2% of the observed 21 hour outage, so a dead feed cancels rather than settling stale.

Fully eliminating this discretion requires reading a specific post-expiry round, which the testnet
feeds do not support. This is stated here rather than hidden.

### Cancellation

If no legal observation appears within the window, `cancelAfterDeadline()` marks the market
`Cancelled` and every participant gets a **full refund** of their own stake. This is the safe
fallback: the protocol never settles on a stale price and never falls back to a human decision.

## Start price freshness

Market creation requires `block.timestamp - startUpdatedAt <= maxStartAge` (default **30 minutes**,
hard cap 24 hours), plus `answer > 0` and `updatedAt > 0`. An arbitrarily stale creation price is
refused, which also handles closed-market periods without needing a trading calendar.

## MockUSDG — testnet collateral only

- **No real value.** It is a demo ERC20 with no backing, no redemption, and no market.
- **`mint` is permissionless** and deliberately so: it lets anyone obtain demo collateral on the
  testnet without a faucet flow. This is a **testnet demo feature** and must never be deployed
  as-is for production collateral.
- The UI labels the environment as testnet with testnet collateral; it does not present it as real
  USDG.

## No mainnet deployment

Only Robinhood Chain Testnet (46630) has been touched. No mainnet transaction exists, no real
funds are involved, and no production capital is at risk.

## Key handling

- Private keys exist only in the gitignored `contracts/.env` (mode 600). They are never printed,
  logged, committed, or written into documentation.
- Earlier development keys are treated as **compromised/exposed**: their addresses appear in git
  history and older docs. They hold no submission role, and their key values have been replaced
  with obvious placeholders in the local env file.
- Submission wallets are freshly generated testnet-only wallets. Only **public addresses** appear
  anywhere in this repository (`docs/DEPLOYMENTS_FINAL.md`).
- `git ls-files | grep '\.env$'` reports no tracked env file, and a full history scan finds no real
  private key.

## No database, no custody

- **No database.** There is no PostgreSQL, SQLite, Redis, Mongo, Supabase, indexer, or queue.
  State is read directly from the contracts and their events.
- **No custody.** The protocol never takes custody of user funds beyond the market collateral that
  participants themselves deposit, and every participant can withdraw their own share through
  `claim()` or `refund()`. There is no operator wallet, no treasury, and no key that can move
  collateral.
- **No mainnet deployment.** Only Robinhood Chain Testnet (46630) has been touched.

## Scope not covered

No external audit, no formal verification, no economic review, no mainnet deployment procedures, no
secondary market, and no recovery path for user error (a wrong `resolvesAt` cannot be edited after
creation — the market simply resolves or cancels on its own terms).
