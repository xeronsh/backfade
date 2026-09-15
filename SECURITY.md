# Security

Backfade is **hackathon testnet software** and has **not received a professional security
audit**. It must not be used with production capital. This document states the actual trust
assumptions rather than implying stronger ones.

## Security model

| Property | Status |
|---|---|
| Proxy / upgradeability | **None.** `ThesisMarket` is immutable: no delegatecall, no storage gaps. |
| Privileged roles | **None.** No `owner`, `admin`, pause, or sweep. |
| Admin settlement | **None.** No trusted resolver, no creator override, no way to rewrite an outcome. |
| Settlement authority | **Permissionless `resolve()`, deterministic math**, no arguments. |
| Creator powers | Create a market and bond capital. Cannot resolve, cancel, or alter it. |
| Pre-expiry oracle values | **Rejected** — `OracleMath: pre-expiry price`. |
| Start-price freshness | **Enforced** — `maxStartAge`, default 30 min, cap 24 h. |
| Settlement window | **Bounded** — default 30 min, bounds 15 min – 24 h. |
| Dead / stale feeds | **Cancellation + full refund**, never a stale-price settlement. |
| Empty winning pool | **Cancellation + full refund**, no stranded collateral. |
| Database / indexer / custody | **None.** The chain is the source of truth. |
| Mainnet deployment | **None.** Testnet only (chain 46630). |
| MockUSDG | **No real-world value.** Permissionless mint, testnet only. |

Key handling

- Private keys exist only in the gitignored `contracts/.env` (mode 600). Never printed, logged,
  committed, or written into documentation.
- Earlier development keys are treated as **compromised** — their addresses are in git history.
  They hold no submission role and their values are placeholders in the local env file.
- Submission wallets are freshly generated testnet-only wallets. Only **public addresses** appear
  in this repository.
- `git ls-files | grep '\.env$'` reports nothing, and a full history scan finds no real key.

## Payout

Pari-mutuel, floor division:

```
payout = stake * totalPool / winningPool        // totalPool = backPool + fadePool
```

- A single winner receives the entire pool; the market drains to exactly **0**.
- With several winners each payout floors, leaving at most **one wei per winner**. Bounded and
  expected — there is deliberately **no admin sweep** that could hide a math error.
- The creator bond is an ordinary BACK position; only the creator can claim it.
- Losing positions can never claim, and double claims revert (`NothingToClaim`).
- If the winning side never received a single stake there is nobody to pay, so pro-rata division
  would divide by an empty pool and strand every stake. Settlement falls back to `Cancelled` and
  each participant withdraws their own stake. Covered by
  `invariant_SettledMarketIsAlwaysPayable` and
  `test_NoOpposingCapitalAndThesisFailsRefundsEveryStake`.

## Oracle assumptions

- Feeds are AggregatorV3-compatible. Every read requires: code present, `answer > 0`,
  `updatedAt > 0`, and valid `decimals`.
- **`getRoundData()` is not implemented on the testnet feeds.** Selector `0x9a6fc8f5` is absent
  from every feed's bytecode and all calls revert with empty data, so pinning a specific
  post-expiry round is not implementable here.
- Testnet feeds are **seeded feeds** (prices pushed via `setAnswer`). They are **not** official
  mainnet Chainlink Stock Token proxies. Production would use the mainnet feeds.
- Measured cadence (4000 updates per feed): median gap 36–52 s, p90 0.75–5.0 min, p99 2.8–6.2 min,
  worst observed outage **21.1 h** (TSLA, GME).

## Settlement semantics and its limitation

The end price must satisfy `resolvesAt <= updatedAt <= resolvesAt + settlementWindow`.

- `updatedAt < resolvesAt` → reverted. A pre-expiry price can never settle a market.
- `updatedAt > resolvesAt + settlementWindow` → rejected; past the window the market can only be
  cancelled.
- The first caller supplying a fully legal observation set freezes the outcome
  (`AlreadyResolved`); later prints cannot re-open it.

Because settlement uses the latest observation **inside** the window, a resolver keeps **bounded**
discretion over which legal print is used: they may wait within the 30 minutes for a more
favourable value. They cannot reach backwards before expiry, cannot exceed the window, and cannot
change the outcome once set.

30 minutes is ~4.9× the worst observed p99 gap, so a normal hiccup cannot force a cancel, while
being ~2% of the observed 21 hour outage, so a dead feed cancels rather than settling stale.
Removing this discretion entirely needs a pinned post-expiry round, which the testnet feeds do not
support. It is stated here rather than hidden.

## Cancellation and refund

If no legal observation appears within the window, `cancelAfterDeadline()` marks the market
`Cancelled` and every participant receives a **full refund** of their own stake via `refund()`.
The protocol never settles on a stale price and never falls back to a human decision.

Start-price freshness at creation requires `block.timestamp - startUpdatedAt <= maxStartAge`
(default 30 min, cap 24 h), plus `answer > 0` and `updatedAt > 0`. This refuses an arbitrarily
stale creation price and handles closed-market periods without a trading calendar.

## Testnet collateral

- MockUSDG has **no value**: no backing, no redemption, no market. It is a demo ERC20.
- **`mint` is permissionless** and deliberately so — anyone can obtain demo collateral on testnet
  without a faucet flow. Never deploy it as-is for production collateral.
- The UI labels the environment as testnet and does not present the token as real USDG.

## Out of scope

No external audit, no formal verification, no economic review, no mainnet deployment procedure, no
secondary market, and no recovery path for user error: a market created with the wrong `resolvesAt`
cannot be edited afterwards — it simply resolves or cancels on its own terms.
