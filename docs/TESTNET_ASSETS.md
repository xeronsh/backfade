# Robinhood Chain Testnet (46630) — Final Feed Verification + Cadence Evidence

> Probed live over RPC `https://rpc.testnet.chain.robinhood.com` on 2026-09-15T02:02:05+00:00.
> Round-history and cadence data below are measured, not assumed.

## Why these numbers set the settlement parameters

The original `settlementWindow` of 6h and `maxStartAge` of 24h were convenience values with no
evidence behind them. This probe replaces them with measurements:

1. **`getRoundData()` is not implemented on any testnet feed.** The selector `0x9a6fc8f5` is
   absent from every feed's bytecode (~1190 bytes, only `latestRoundData`), and every call
   reverts with empty data. Selecting "the first round after expiry" is therefore *not
   implementable* on this testnet — the fallback path in the spec applies.
2. **Feeds update far more often than assumed.** Median gap is ~36-52s, p99 under ~6min.
   A 6h settlement window was ~400x the p99 gap: pointless optionality.
3. **But the feeds do go down.** The 4000-update probe found a **21.1h outage** in the TSLA
   and GME history, so the window must stay short enough that a dead feed ends in a full refund
   rather than a stale-price settlement.

Resulting constants (5-8x the p99 gap, ~2% of the observed outage):

| Parameter | Before | Measured basis | After |
|---|---|---|---|
| `DEFAULT_SETTLEMENT_WINDOW` | 6h | 30min ~= 4.9x worst p99 (6.17min) | **30 minutes** |
| `DEFAULT_MAX_START_AGE` | 24h | same multiple applied to creation price | **30 minutes** |
| `MIN_SETTLEMENT_WINDOW` | 5min | 15min ~= 2.4x worst p99 (6.17min) | **15 minutes** |
| `MAX_SETTLEMENT_WINDOW` | 7d | immutable hard cap per market | **24 hours** |

## Feed verification

| Symbol | Feed address | Code | Decimals | Description | latest roundId | latest answer | latest updatedAt | `getRoundData` | Status |
|---|---|---|---|---|---|---|---|---|---|
| TSLA | `0x81b48EC24970aA75Ae940e2492fdA006071aC31B` | yes | 8 | "TSLA / USD (testnet)" | 47342 [4.734e4] | $359.83 | 1789437267 | absent (reverts) | PASS |
| AMZN | `0x8D165612B0d63416141833834257386586f34224` | yes | 8 | "AMZN / USD (testnet)" | 47956 [4.795e4] | $253.74 | 1789437109 | absent (reverts) | PASS |
| PLTR | `0x84206ED5EBF05B1519486742344d0499Df875Bd0` | yes | 8 | "PLTR / USD (testnet)" | 42468 [4.246e4] | $172.74 | 1789437360 | absent (reverts) | PASS |
| AMD | `0x5406FC983e7f84B544FF6fc855e06c22Cf36A795` | yes | 8 | "AMD / USD (testnet)" | 93681 [9.368e4] | $494.92 | 1789437390 | absent (reverts) | PASS |
| NVDA | `0xBf15aA8CB0f376DB8fcb309347CB7375567bEC6B` | yes | 8 | "NVDA / USD (testnet)" | 80814 [8.081e4] | $212.50 | 1789437420 | absent (reverts) | PASS |
| GME | `0x7ca5707aCC7a2B87c16B60848fb2582311BE3b4f` | yes | 8 | "GME / USD (testnet)" | 32972 [3.297e4] | $21.54 | 1789437330 | absent (reverts) | PASS |
| AAPL | `0x139C8342c1A138817D0A83872881CC8CEC183749` | yes | 8 | "AAPL / USD (testnet)" | 52038 [5.203e4] | $332.60 | 1789437419 | absent (reverts) | PASS |
| COIN | `0x1f1699510abfdAd90D82e2624136224B6b4EC7C8` | yes | 8 | "COIN / USD (testnet)" | 38891 [3.889e4] | $186.94 | 1789437538 | absent (reverts) | PASS |
| META | `0xA022D2d137fE6E8980666DB672CB92005A8A78B9` | yes | 8 | "META / USD (testnet)" | 80280 [8.028e4] | $663.47 | 1789437632 | absent (reverts) | PASS |
| NFLX | `0x5ca7a619217e5eFFD9B57Ba58CC5981AEcE1Bec6` | yes | 8 | "NFLX / USD (testnet)" | 57324 [5.732e4] | $80.02 | 1789437640 | absent (reverts) | PASS |

## Observed update cadence (measured from onchain update transactions)

| Symbol | updates sampled | window | median gap | p90 | p99 | worst gap | age of newest print |
|---|---|---|---|---|---|---|---|
| TSLA | 2000 | 48.5h | 0.72min | 3.57min | 5.52min | 5.8min | 0.8min |
| AMZN | 2000 | 47.1h | 0.73min | 3.32min | 5.50min | 6.3min | 4.2min |
| PLTR | 2000 | 48.5h | 0.67min | 4.77min | 5.55min | 6.9min | 0.8min |
| AMD | 2000 | 22.5h | 0.60min | 0.75min | 4.65min | 8.1min | 1.0min |
| NVDA | 2000 | 20.9h | 0.60min | 0.72min | 1.27min | 5.5min | 1.3min |
| GME | 2000 | 61.7h | 1.02min | 5.05min | 6.17min | 20.1min | 3.5min |
| AAPL | 2000 | 33.6h | 0.63min | 1.78min | 5.42min | 7.5min | 2.8min |
| COIN | 2000 | 49.1h | 0.70min | 4.18min | 5.50min | 7.2min | 1.6min |
| META | 2000 | 23.6h | 0.62min | 0.88min | 3.98min | 5.3min | 0.8min |
| NFLX | 2000 | 27.5h | 0.62min | 1.20min | 5.17min | 7.2min | 1.4min |

**Aggregate (2000 updates per feed)**: median-of-medians 0.65min, worst median 1.02min, worst p99
6.17min, worst gap in sample 20.1min. The deeper 4000-update probe additionally found a 21.1h
outage on TSLA and GME — that outlier is what rules out a long settlement window.

## Rejected

| Address | Reason |
|---|---|
| `0x4A1166...7C38` (TSLA mainnet proxy) | no code on 46630 — testnet has separate seeded feeds |
| every feed's `getRoundData(uint80)` | selector absent from bytecode; call reverts — round-history settlement impossible |

## Reproduce

```bash
RPC=https://rpc.testnet.chain.robinhood.com
FEED=0x81b48EC24970aA75Ae940e2492fdA006071aC31B
cast code $FEED --rpc-url $RPC | grep -c 9a6fc8f5   # 0 -> getRoundData not implemented
cast call $FEED "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RPC
cast call $FEED "getRoundData(uint80)(uint80,int256,uint256,uint256,uint80)" 1 --rpc-url $RPC  # reverts
curl -sS "https://explorer.testnet.chain.robinhood.com/api/v2/addresses/$FEED/transactions?filter=to" | head -c 400
```

