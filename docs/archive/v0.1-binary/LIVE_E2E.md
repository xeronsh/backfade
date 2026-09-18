# Live E2E — final deployment

Every number below was read back from Robinhood Chain Testnet, not copied from an earlier run.
Reproduce any line with the `cast` command shown next to it.

Network

| | |
|---|---|
| Chain ID | `46630` |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | https://explorer.testnet.chain.robinhood.com |

Contracts

| Contract | Address |
|---|---|
| MockUSDG (collateral, 18 dp) | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` |
| Demo ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` |

## The thesis

> "AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark."

| Parameter | Value |
|---|---|
| Basket | AMD 6000 bps (60%) + PLTR 4000 bps (40%) |
| Benchmark | TSLA |
| Hurdle | +1000 bps (+10%) |
| Creator bond | 500 MockUSDG (BACK side) |
| Entry window (`bettingEndsAt`) | 1789442967 |
| Expiry (`resolvesAt`) | 1789444167 |
| Settlement window | 1800 s |

## Transactions

| Step | Transaction |
|---|---|
| Approve collateral | [`0x5bb5104d1faa8952b0c29464e18d0f1e0114943787420a0292babd87c3182754`](https://explorer.testnet.chain.robinhood.com/tx/0x5bb5104d1faa8952b0c29464e18d0f1e0114943787420a0292babd87c3182754) |
| Create market (factory) | [`0x669eaacf04d2452c7df9f1a45931863c596bcdc14ea2e9ff32c821f41cd73c4c`](https://explorer.testnet.chain.robinhood.com/tx/0x669eaacf04d2452c7df9f1a45931863c596bcdc14ea2e9ff32c821f41cd73c4c) |
| BACK 300 (trader) | [`0xf26b7cd27478804cce9715789c4dd16c1e9044d2d272b5433f40ff75c384e51b`](https://explorer.testnet.chain.robinhood.com/tx/0xf26b7cd27478804cce9715789c4dd16c1e9044d2d272b5433f40ff75c384e51b) |
| FADE 200 (trader) | [`0x288cb19639ba5d0eeebb8b36e36b2c2e981e34fe8837ba0b073295e4cb2b14fb`](https://explorer.testnet.chain.robinhood.com/tx/0x288cb19639ba5d0eeebb8b36e36b2c2e981e34fe8837ba0b073295e4cb2b14fb) |
| Resolve | [`0x47f0d2d4d0dffe73e434d6c548ce6136a5cd92f8d74c7facae71ee2b2024a858`](https://explorer.testnet.chain.robinhood.com/tx/0x47f0d2d4d0dffe73e434d6c548ce6136a5cd92f8d74c7facae71ee2b2024a858) |
| Winner claim | [`0x973438d3a164df0624f0c039976a9cad868b39c33d2721b8ca3ecfa0dadc825f`](https://explorer.testnet.chain.robinhood.com/tx/0x973438d3a164df0624f0c039976a9cad868b39c33d2721b8ca3ecfa0dadc825f) |

## Oracle observations

Prices are the feed value the contract actually recorded. Start prices are read from the
market's own storage, so they are exactly what settlement used:

```bash
cast call 0xBf496Ef435C814C81864b5F337F23b63D4b26BB3 \
  'startPrices(uint256)(int256)' 0 --rpc-url https://rpc.testnet.chain.robinhood.com   # AMD
```

| Feed | Start (8 dp) | End (8 dp) | Start block | End block |
|---|---|---|---|---|
| AMD | 49,481,000,000 | 49,450,000,000 | 119698588 | 119707718 |
| PLTR | 17,250,500,000 | 17,243,500,000 | 119698593 | 119707721 |
| TSLA (benchmark) | 35,987,890,846 | 35,989,721,393 | 119697936 | 119707711 |

## Recomputation

`OracleMath.returnBps` scales by 1e18 before converting to bps, then **truncates toward
zero** (Solidity `/`), which is not Python's `//` for negative values:

```python
def div_toward_zero(a, b):
    """Solidity integer division: truncates toward zero, unlike Python's //."""
    q = abs(a) // abs(b)
    return q if (a < 0) == (b < 0) else -q

def return_bps(start, end):
    scaled = div_toward_zero(end * 10**18, start) - 10**18
    return div_toward_zero(scaled * 10_000, 10**18)

amd  = return_bps(49_481_000_000, 49_450_000_000)   # -6
pltr = return_bps(17_250_500_000, 17_243_500_000)   # -4
tsla = return_bps(35_987_890_846, 35_989_721_393)   #  0

basket = div_toward_zero(amd * 6000 + pltr * 4000, 10_000)   # -5
alpha  = basket - tsla                                       # -5

assert alpha == -5          # matches narrativeAlphaBps() onchain
assert alpha < 1000         # below the hurdle -> FADE
```

Onchain read-back:

```bash
cast call $MARKET 'narrativeAlphaBps()(int256)' --rpc-url $RPC   # -5
cast call $MARKET 'outcome()(uint8)'            --rpc-url $RPC   # 2 = Fade
```

## Result

| | |
|---|---|
| Narrative Alpha | **−5 bps** |
| Hurdle | +1000 bps |
| Outcome | **FADE** |
| Pools | 800 BACK / 200 FADE |
| Winner payout | **1000 MockUSDG** (200 stake × 1000 total ÷ 200 winning pool) |
| Market balance after claim | **0** |
| `totalClaimed` | 1000 |

The losing side's `claim()` reverts, as it must. After the winner claimed, the market held
exactly zero collateral: pari-mutuel, no house cut, nothing left behind.

## Settlement-window rejection

Reproduced on this deployment. A second market (`0x08042F839fc704B71bA42D11B567210480a51C44`,
expiry `1789449886`) was resolved immediately after expiry while the TSLA print was still stamped
one second *before* expiry:

```
TSLA updatedAt = 1789449885  ->  resolve() REVERTED: OracleMath: pre-expiry price
TSLA updatedAt = 1789449956  ->  resolve() SUCCEEDED
```

Settlement refused to price an expired thesis off a stale observation and only accepted the market
once a post-expiry print existed. This is the anti-lookback guard doing its job, observed on the
live chain rather than asserted only in a unit test.

## Empty winning pool -> cancellation

That same market then exercised the refund guard. Settlement decided FADE (alpha +16 bps, below
the +1000 bps hurdle), but nobody had ever taken the FADE side, so the winning pool was empty and
pro-rata payout had nobody to pay:

| | |
|---|---|
| `narrativeAlphaBps` | +16 |
| `backPool` / `fadePool` | 100 / **0** |
| `outcome` | `Cancelled` (3) |
| `resolve()` tx | [`0x16d9d21ce938731513381797402edd5dc106c5dc8e6c67ca966fe37eea445bef`](https://explorer.testnet.chain.robinhood.com/tx/0x16d9d21ce938731513381797402edd5dc106c5dc8e6c67ca966fe37eea445bef) |
| `claim()` | **reverted** — a cancelled market pays through `refund()` |
| `refund()` tx | [`0xe48731995c38b44403616f128517c9f4f5a87c58ba931af88fddc136b47f6588`](https://explorer.testnet.chain.robinhood.com/tx/0xe48731995c38b44403616f128517c9f4f5a87c58ba931af88fddc136b47f6588) |
| Market balance | 100 → **0** |

Without this guard the creator's 100 MockUSDG would have been permanently unreachable: the
winning side held no stake, and cancellation was already blocked by `AlreadyResolved`. The refund
path returns every stake instead.

## Cancellation and refund

The same deployment was exercised on its fallback path. A market was created with a 30-minute
settlement window and one FADE position of 200 MockUSDG, then left until the window closed.

| Step | Result |
|---|---|
| `resolve()` after the window | **reverted** `SettlementWindowPassed` |
| `cancelAfterDeadline()` | [`0x5e643655a3b9717ebd717897fd390999e6d78b799ecdf280ee0756c333a94eab`](https://explorer.testnet.chain.robinhood.com/tx/0x5e643655a3b9717ebd717897fd390999e6d78b799ecdf280ee0756c333a94eab) |
| `claim()` on a cancelled market | **reverted** `NotCancelled` |
| `refund()` (FADE holder) | [`0x479594b28063dac7410722110b81134badc65a0327b97b323a3825d3e9e34d8d`](https://explorer.testnet.chain.robinhood.com/tx/0x479594b28063dac7410722110b81134badc65a0327b97b323a3825d3e9e34d8d) |
| `refund()` a second time | **reverted** `NoPosition` |
| Market balance | 200 → **0** |

The participant's balance returned to its pre-position value exactly. Placing a position on the
other side of this market is not possible in the same run, which is the point: a market that never
gets a legal oracle print refunds everyone rather than settling on a stale price or stranding
collateral.

The UI derives these states from the same inputs and is covered by
`web/src/lib/market/state.test.ts`; all lifecycle branches are rendered by the React Market route.

## Platform migration wallet E2E status

The canonical contract E2E above is live and explorer-backed. The React migration's browser-wallet
run is **blocked in this execution environment**: no browser wallet extension is installed and no
WalletConnect project credential is available. No mock result is recorded as a live pass.

Required manual run on the current deployment: Connect and switch to Robinhood Chain Testnet,
Approve exact collateral, Create, BACK, FADE, Resolve or Cancel, then Claim or Refund. Record the
resulting explorer transaction links here before treating the real-wallet gate as passed.
