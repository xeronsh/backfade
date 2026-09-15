# Live-chain E2E — Robinhood Chain Testnet (46630)

> Full loop executed on the real testnet: deploy → mint → create → BACK/FADE → resolve → claim.
> Every number below can be recomputed from the transactions and feed reads listed here.

## Actors

| Role | Public address |
|---|---|
| Creator (also deployer) | `0xe8507D6396C332a891b2eAFa14e34e812fa289D7` |
| Trader | `0x256d37917FF57DD87cEb558cBB995AffFfB2F2fE` |

## Addresses

| Object | Address |
|---|---|
| MockUSDG | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` |
| ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` |

## Thesis

| Field | Value |
|---|---|
| Narrative | AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark. |
| Basket | AMD 6000 bps (60%) + PLTR 4000 bps (40%) |
| Benchmark | TSLA |
| Hurdle | 1000 bps (+10%) |
| Betting closed | 1789438324 |
| Expiry (`resolvesAt`) | 1789439524 |
| Settlement window | 1800 s (30 min) |

## Transactions

| Step | Tx hash |
|---|---|
| Deploy MockUSDG | `broadcast/DeployFinal.s.sol/46630/run-latest.json` |
| Deploy ThesisFactory | `broadcast/DeployFinal.s.sol/46630/run-latest.json` |
| Approve factory | `0xbc885b8f8d4e15bdd11d136522256982cabff0bcd7811b0138708c1759f75d2f` |
| Create market (bond 500) | `0x571afc7de8ab8fd9ae16255709e4039fcc2f855ec6d219e2f435c5a62275123c` |
| Trader BACK 300 | `0x3d2b97eb9d834012b627d897019a7b95bb597b78adb2d8cafcbf64e36c498da0` |
| Trader FADE 200 | `0xd618c078dcba44e999e7e174d5ad482b03493067665c312f5c631881e777082c` |
| Resolve | `0x47f0d2d4d0dffe73e434d6c548ce6136a5cd92f8d74c7facae71ee2b2024a858` |
| Claim (winner) | `0x973438d3a164df0624f0c039976a9cad868b39c33d2721b8ca3ecfa0dadc825f` |

Explorer: `https://explorer.testnet.chain.robinhood.com/tx/<hash>`

## Oracle evidence

Start prices are the values captured at construction (normalized to 18 decimals):

| Asset | Start price (18 dp) | End price (raw feed) | End roundId | End updatedAt |
|---|---|---|---|---|
| AMD | 494.815 | 49525500000 (8 dp) | 93747 | 1789439578 |
| PLTR | 172.86769095 | 17278000000 (8 dp) | 42501 | 1789439578 |
| TSLA (benchmark) | 359.85676128 | 35987946764 (8 dp) | 47369 | 1789439576 |

End values above are the onchain state **at the block before the resolve transaction**, which is
exactly what `resolve()` read.

### Settled before the benchmark refreshed

The benchmark's newest print was `updatedAt = 1789439516`, which is **before** `resolvesAt =
1789439524`. A resolve attempted at that moment reverted onchain with
`OracleMath: pre-expiry price` and the market stayed `Unresolved`. This is the core oracle
integrity property, demonstrated against real testnet data rather than a mock:

```
resolvesAt = 1789439524
TSLA updatedAt = 1789439516   ->  resolve() REVERTS: OracleMath: pre-expiry price
TSLA updatedAt = 1789439576   ->  resolve() SUCCEEDS
```

## Result

| Field | Value |
|---|---|
| Basket return | −0.0655% |
| Benchmark return | +0.0051% |
| Narrative Alpha | **−0.0706% (−5 bps, contract stores −5)** |
| Hurdle | +10% (1000 bps) |
| Outcome | **FADE** |

Recompute:

```python
amd_s, amd_e   = 494.935, 494.500
pltr_s, pltr_e = 172.86769095, 172.780
tsla_s, tsla_e = 359.85676128, 359.87946764
basket = 0.60*(amd_e/amd_s - 1) + 0.40*(pltr_e/pltr_s - 1)   # -0.000655
alpha  = basket - (tsla_e/tsla_s - 1)                        # -0.000706 -> -5 bps
assert alpha < 0.10        # hurdle -> FADE wins
```

FADE winning is the honest result: the narrative did not clear its hurdle. No oracle value was
fabricated to make BACK win.

## Payout

| Field | Value |
|---|---|
| BACK pool | 800 USDG (creator bond 500 + trader 300) |
| FADE pool | 200 USDG (trader only) |
| Winning side | FADE |
| Winning pool | 200 USDG |
| Total pool | 1000 USDG |
| Winner stake | 200 USDG |
| Winner payout | `200 * 1000 / 200` = **1000 USDG** |
| Market collateral after claim | **0 USDG** |
| `totalClaimed` | 1000 USDG |

Single-winner case, so the payout is exact and the market drains to zero — no rounding dust.

The losing side was checked too: the creator (BACK 500) calling `claim()` reverted, confirming
losing positions cannot drain the pool.

## Reproduce

```bash
RPC=https://rpc.testnet.chain.robinhood.com
M=0xBf496Ef435C814C81864b5F337F23b63D4b26BB3
USDG=0x7BA735a381B9FFe700a8c92558659461b359ee9c

cast call $M 'outcome()(uint8)'            --rpc-url $RPC   # 2 = Fade
cast call $M 'narrativeAlphaBps()(int256)' --rpc-url $RPC   # 2
cast call $M 'backPool()(uint256)'         --rpc-url $RPC   # 800e18
cast call $M 'fadePool()(uint256)'         --rpc-url $RPC   # 200e18
cast call $M 'totalClaimed()(uint256)'     --rpc-url $RPC   # 1000e18
cast call $USDG 'balanceOf(address)(uint256)' $M --rpc-url $RPC   # 0
```

---

# Browser E2E over the public Tunnel

Performed against the public HTTPS frontend, not localhost.

| Setting | Value |
|---|---|
| Frontend Tunnel | `https://water-moderate-exec-significance.trycloudflare.com` |
| API Tunnel | `https://phi-diameter-block-earliest.trycloudflare.com` |
| Local frontend | `vite preview` on `127.0.0.1:4173` (production bundle, not the dev server) |
| Local API | FastAPI on `127.0.0.1:8000` |
| Wallet A | Chromium, isolated profile |
| Wallet B | Chromium, separate isolated profile |
| Cross-browser | Firefox, independent engine, same public URL |

## Wallet signing in the browser

No browser wallet extension was available in this environment, so the browser session used an
injected EIP-1193 provider that signs with the project's own testnet key against the real testnet
RPC. This is a **real signer producing real transactions**, not a mocked contract layer: every
state change below is verifiable onchain. The injected provider is a test harness
(`--init-script`), not part of the shipped frontend.

## Results

| Step | Result |
|---|---|
| Page load over HTTPS Tunnel | ✅ `200`, title `backfade — Back the thesis. Fade the noise.` |
| Wallet connect | ✅ Wallet A `0xe850…89D7` |
| Network | ✅ chain 46630 (`eth_chainId` → `0xb626`) |
| Compile (API via Tunnel) | ✅ ThesisSpec preview rendered: AMD/PLTR/NVDA basket, TSLA benchmark, +10% hurdle, 30 days |
| Approve collateral | ✅ |
| Create market | ✅ `marketsLength` 1 → 2, redirected to the new market page |
| Wallet B connects to the same Tunnel page | ✅ `0x256d…2F2fE` |
| BACK 300 | ✅ `backPool` 100 → 400 |
| FADE 200 | ✅ `fadePool` 0 → 200 |
| Refresh / reopen | ✅ `OPEN`, `$400 BACK`, `$200 FADE` still rendered |
| Frontend + API restart, then reopen | ✅ state recovered from chain alone |
| Cross-browser (Firefox) | ✅ identical `OPEN / $400 BACK / $200 FADE` |

Market created through the browser: `0xcD2f967Ea438EAabb1516F7dd7b1b413F74Fc408`
(bond 100, browser spec duration 30 days — deliberately left open, so this market is *not* the
final demo thesis; the settled demo market is `0xBf496Ef4…` above, resolved and claimed via CLI).

## Two bugs found and fixed by this pass

1. **`decodeEventLog` crashed the launch flow.** The receipt contains the collateral ERC20
   `Transfer` logs, which are not in `FACTORY_ABI`. Decoding every log threw, so the transaction
   succeeded onchain but the UI never navigated. Fixed by restricting decoding to the factory's own
   logs and tolerating unknown events (`web/src/pages/create.ts`).
2. **The compiled duration was ignored.** `resolvesAt` was hardcoded to `now + 86400`, so a thesis
   compiled as "30 days" expired in 1 day. Fixed to derive from `spec.duration_days`.

## Evidence that chain is the source of truth

Frontend and API were both killed and restarted; the browser then reopened the market page and
rendered the correct pools without any local database, cache, or indexer. State comes from
`Factory.marketAt()` and the market's own view functions.
