# Backfade v0.2 Mechanism

Backfade is a social protocol for capital-backed crypto opinions:

> If you call it, bond it. If you doubt it, fade it.

The protocol has three primitives: a bonded Thesis, a capital-backed Challenge, and a permanent realized Track Record. The user-facing product is social; the contract is the settlement source of truth.

## Thesis

A Thesis is a relative investment opinion:

- `narrative`: immutable text written by the creator;
- `basket`: one to five approved feeds with integer `weightBps` values summing to `10,000`;
- `reference`: one different approved feed that the Thesis claims to outperform;
- `creatorBond`: canonical collateral posted by the creator;
- `challengeEndsAt`: deployment-configured opening window;
- `resolvesAt`: deployment-configured horizon.

The creator explicitly confirms the Reference before the wallet transaction. The AI compiler may structure the narrative and suggest a Reference, but it never silently chooses financial truth, payout rules, collateral, or settlement.

After creation, narrative, basket, reference, and start prices cannot be edited. The Factory accepts only its deployment-configured collateral and feed allowlist. v0.2 has no arbitrary ERC20, arbitrary feed, fee, governance, proxy, or upgrade path.

## Challenge and Open Bounty

A Challenge is a disagreement with both text and capital:

```text
challenger + amount + note
```

The note is plain text, non-empty, and at most 280 UTF-8 bytes. There are no free replies and no generic Back position. The creator cannot Challenge their own Thesis.

The creator's bond is a public bounty:

```text
openBounty = creatorBond - challengePool
matchedConviction = min(creatorBond, challengePool)
```

The Factory and Thesis contract enforce `challengePool <= creatorBond`, so every Fade dollar has real creator capital opposite it. The creator may add conviction during the open window, but cannot reduce or withdraw it. A Challenge can never exceed the current Open Bounty.

## Lifecycle

```text
OPEN → LOCKED → SETTLED
                    ↘ CANCELLED
```

- `OPEN`: Challenges and creator raises are allowed before the configured window end timestamp.
- `LOCKED`: the window is closed; the Thesis waits for expiry and a safe oracle observation.
- `SETTLED`: realized Alpha and payout pools are stored; participants pull their claims.
- `CANCELLED`: the safe settlement deadline passed; every participant receives principal and P&L is zero.

Settlement is permissionless. Each basket and Reference feed must have a positive observation with an update timestamp at or after expiry and no later than `resolvesAt + settlementWindow`. Pre-expiry, future, stale, non-positive, or missing observations cannot settle a Thesis.

## Narrative Alpha

Prices are normalized to 18 decimals. For each feed:

```text
assetReturnBps = ((endPrice / startPrice) - 1) × 10,000
basketReturnBps = Σ(assetReturnBps × weightBps) / 10,000
referenceReturnBps = ((referenceEnd / referenceStart) - 1) × 10,000
Narrative Alpha = basketReturnBps - referenceReturnBps
```

Narrative Alpha is a Backfade product metric. It is not Jensen's Alpha or CAPM alpha. The actual signed value is retained and displayed as `Live Alpha` before settlement and `Realized Alpha` after settlement. It is never reduced to true/false, winner/loser, or a binary outcome.

## Continuous payout

`PAYOUT_RANGE_BPS = 1,000` represents a financial transfer range of ±10%. Actual Narrative Alpha is not capped; only the transfer is bounded:

```text
bounded = min(abs(realizedAlphaBps), PAYOUT_RANGE_BPS)
transfer = challengePool × bounded / PAYOUT_RANGE_BPS
```

For positive Alpha:

```text
creatorPayout = creatorBond + transfer
challengePayoutPool = challengePool - transfer
```

For negative Alpha:

```text
creatorPayout = creatorBond - transfer
challengePayoutPool = challengePool + transfer
```

At zero Alpha, both sides receive principal. A positive Alpha never decreases the creator payout or increases the Challenge payout pool. A negative Alpha has the inverse effect. Alpha outside ±10% does not increase the financial transfer further.

Examples with a `$1,000` creator bond, `$600` Challenge Pool, and ±10% payout range:

| Realized Alpha | Creator payout | Challengers total |
| ---: | ---: | ---: |
| `+4%` | `$1,240` | `$360` |
| `-4%` | `$760` | `$840` |
| `+10%` | `$1,600` | `$0` |
| `-10%` | `$400` | `$1,200` |
| `+25%` | `$1,600` | `$0` |

A Thesis with no Challengers still records Alpha and returns the creator's bond, but `Matched Conviction` is zero and it does not contribute to matched-weighted reputation metrics.

## Claims and rounding

Each Challenger owns a share of the Challenge Pool:

```text
challengerPayout = challengerStake × challengePayoutPool / challengePool
```

The division floors to integer token units. Settlement never loops over Challengers. Claims are pull-based, one per address, and the `claimed` guard prevents double claims. The only expected balance after all valid claims is integer division dust; there is no protocol fee.

The contract preserves the collateral conservation invariant:

```text
creatorPayout + challengePayoutPool = creatorBond + challengePool
```

The aggregate of individual Challenger claims is less than or equal to `challengePayoutPool`; the difference is documented rounding dust.

## Cancellation

If a safe observation cannot be made by the settlement deadline, anyone can cancel. Cancellation stores zero Realized Alpha, refunds the creator bond and each Challenger stake, and keeps the permanent lifecycle record. No fabricated price or financial result is used.

## Social data

The contract emits `ThesisCreated`, `ConvictionRaised`, `ChallengePosted`, `ThesisSettled`, `ThesisCancelled`, and `Claimed`. Events are the social activity tape. The contract stores settlement-critical data only: narrative, basket, Reference, creator, bonds, Challenge stakes, timestamps, start prices, Alpha, payout state, claims, and lifecycle state. Followers, likes, free comments, feed ranking, profiles, and leaderboard aggregates stay outside the contract and are derived client-side from Factory data and events.
