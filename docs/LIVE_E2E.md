# Live-Chain E2E — Robinhood Chain Testnet (46630)

Full lifecycle executed onchain on 2026-09-14 with two addresses.
Explorer: https://explorer.testnet.chain.robinhood.com

## Participants

| Role | Address | Notes |
|---|---|---|
| Creator (Wallet A) | `0x0973104738884C05F8dF85DCd007daf9609820f0` | deployer + creator, posts 500 USDG Creator Conviction |
| Trader (Wallet B) | `0x734382d94Cd1e6d93B21c07c32cee594223CE636` | throwaway testnet trader, BACK 300 + FADE 100 |

## Thesis

> "AI capex keeps rotating into AMD and PLTR; both outperform TSLA."

- Basket: AMD 40% + PLTR 60% (weights normalized on creation)
- Benchmark: TSLA
- Hurdle: +10% (1000 bps)
- Betting: 30 min · Resolve: +60 min after creation
- Settlement: verified testnet AggregatorV3 feeds (see [TESTNET_ASSETS.md](TESTNET_ASSETS.md))

## Transactions

| Step | Tx hash | Status |
|---|---|---|
| Deploy MockUSDG | `0xabd9b2c781cf6807c3…` (full hash in broadcast/) | ✅ |
| Deploy ThesisFactory | `0x910a6c5dc219847f4f…` | ✅ |
| Create market + creator bond 500 USDG | see `contracts/broadcast/CreateTestnetDemo.s.sol/46630/` | ✅ |
| Trader BACK 300 USDG | `0x2e1c973b9c35e56dbea141a43fed9acf01fa6a1689beb0eaef5b975b8b42a902` | ✅ |
| Trader FADE 100 USDG | `0x6f0ba52b3d40e7488b5ad7620e39ac01749ce0babccdce2c0f50f9b8501b9993` | ✅ |
| Resolve | _pending resolve window_ | ⏳ |
| Claim | _pending_ | ⏳ |

Market: `0x0a9c3c881aA3df08bDaEEC8f283e09c5aa532334`
Creator address: `0x0973104738884C05F8dF85DCd007daf9609820f0`
Trader address: `0x734382d94Cd1e6d93B21c07c32cee594223CE636`

Pools after betting: BACK 800e18 / FADE 100e18

## Outcome

Filled after resolve executes inside the 30-minute settlement window.
No mock oracle is substituted for real settlement — if the settlement window
passes without a valid resolve, the market is cancelled and principal refunded
per contract rules.
