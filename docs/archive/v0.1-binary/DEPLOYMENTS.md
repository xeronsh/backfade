# Deployment — Robinhood Chain Testnet

Verified live over RPC `https://rpc.testnet.chain.robinhood.com` on 2026-09-15.

## Network

| Field | Value |
|---|---|
| Network | Robinhood Chain Testnet |
| Chain ID | 46630 |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | https://explorer.testnet.chain.robinhood.com |
| Collateral | MockUSDG (testnet only, no value) |

## Build provenance

| Field | Value |
|---|---|
| Solidity | 0.8.24 |
| Optimizer | **enabled, runs = 200** |
| via_ir | false |
| Runtime sizes | MockUSDG 1,884 B · ThesisFactory 15,189 B · ThesisMarket 8,064 B (limit 24,576 B) |
| EVM version | cancun |

The optimizer is required, not cosmetic: `ThesisFactory` is 27,116 B without it, above the
24,576 B EIP-170 limit, because the factory runtime embeds the market creation bytecode.

## Contracts

| Contract | Address |
|---|---|
| MockUSDG | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` |
| Demo ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` |

Deploy transactions are in `contracts/broadcast/Deploy.s.sol/46630/`.

## Demo market

| Field | Value |
|---|---|
| Narrative | AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark. |
| Basket | AMD 60% + PLTR 40% |
| Benchmark | TSLA |
| Hurdle | +1000 bps (10%) |
| Settlement window | 1800 s (30 min, factory default) |
| Creator bond | 500 MockUSDG |
| Expiry (`resolvesAt`) | 1789444167 |

Start prices are read from the market's own storage (`startPrices(uint256)`):

| Leg | Start price (8 dp) |
|---|---|
| AMD | 49,481,000,000 |
| PLTR | 17,250,500,000 |
| TSLA (benchmark) | 35,987,890,846 |

The settlement run against this market is in [`LIVE_E2E.md`](LIVE_E2E.md).

Three further markets were created on the same factory to exercise the fallback paths, and are
recorded there:

| Market | Purpose | Outcome |
|---|---|---|
| `0xD30d2366b9599a6d347195aF2eaf31F637F49A1C` | settlement window closes with no legal print | `Cancelled` → refunds, balance 200 → 0 |
| `0x08042F839fc704B71bA42D11B567210480a51C44` | pre-expiry print rejected, then empty winning pool | `Cancelled` → refunds, balance 100 → 0 |
| `0x308C6E7ECe75bb733Cb9c7032561c0D138279799` | UI `CANCELLABLE` state rendering | `Cancelled` |

## Wallets

| Role | Public address |
|---|---|
| Deployer / creator | `0xe8507D6396C332a891b2eAFa14e34e812fa289D7` |
| Trader / counterparty | `0x256d37917FF57DD87cEb558cBB995AffFfB2F2fE` |

Both are testnet-only wallets generated for this submission. An earlier development wallet
(`0x0973…820f0`) appears in git history and is treated as compromised; its key has been replaced
with a placeholder in `contracts/.env` and it holds no submission role.

Private keys exist only in the gitignored `contracts/.env` (mode 600) and are never printed,
logged, committed, or included in this document.

## Source verification

| Contract | Status |
|---|---|
| ThesisFactory | ✅ verified — `is_verified: true` |
| Demo ThesisMarket | ✅ verified, constructor args included |
| MockUSDG | ✅ verified by bytecode identity — see note below |

Settings that must match exactly:

| Setting | Value |
|---|---|
| Compiler | `v0.8.24` |
| Optimizer | enabled, 200 runs |
| EVM version | `cancun` |
| Verifier | Blockscout |

```bash
cd contracts
forge verify-contract 0x9Db674834F4C060114Cb53f21e179fc54F905342 src/ThesisFactory.sol:ThesisFactory \
  --rpc-url https://rpc.testnet.chain.robinhood.com \
  --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/ \
  --compiler-version 0.8.24 --num-of-optimizations 200 --evm-version cancun
```

**MockUSDG note.** Its runtime is byte-for-byte identical to the previously verified MockUSDG
(`cast code` returns the same 3,770-character runtime from both addresses), so the deployed source
is provably the verified `src/MockUSDG.sol`. The explorer API reports `is_verified: false` for this
address only because Blockscout's re-verification endpoint deduplicates by bytecode and responds
"already verified" without attaching the new address. `forge verify-contract` reports the same.

**API access.** The explorer's plain `curl` API is behind a WAF rule (Cloudflare error 1010); the
`forge` CLI path above is the reliable route.

## History

These contracts are a redeployment, not the first testnet deployment. The earlier factory was
replaced because `ThesisFactory` embeds the market creation bytecode, so the empty-winning-pool
refund guard added to `ThesisMarket` required a new factory — a market created by the old factory
would have kept the old settlement behaviour. Superseded addresses remain in git history.
