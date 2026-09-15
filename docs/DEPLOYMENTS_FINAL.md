# Final Deployment — Robinhood Chain Testnet

> Supersedes the pre-hardening deployment recorded in `DEPLOYMENTS.md` (kept as historical
> evidence, no longer the submission deployment).
> Verified live over RPC `https://rpc.testnet.chain.robinhood.com` on 2026-09-15.

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
| Optimizer | **enabled, runs = 200** (required: `ThesisFactory` is 27,116 B without it, above the 24,576 B EIP-170 limit; 15,068 B with it) |
| via_ir | false |
| Runtime sizes | MockUSDG 1,884 B · ThesisFactory 15,189 B · ThesisMarket 8,064 B (limit 24,576 B) |
| EVM version | cancun |

## Contracts

| Contract | Address | Deploy Tx |
|---|---|---|
| MockUSDG | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` | see `contracts/broadcast/DeployFinal.s.sol/46630/` |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` | see `contracts/broadcast/DeployFinal.s.sol/46630/` |

## Demo market

| Field | Value |
|---|---|
| ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` |
| Narrative | AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark. |
| Basket | AMD 60% + PLTR 40% |
| Benchmark | TSLA |
| Hurdle | +1000 bps (10%) |
| Settlement window | 1800 s (30 min, factory default) |
| Expiry (`resolvesAt`) | 1789444167 |
| Start AMD | 494.935 |
| Start PLTR | 172.490 |
| Start TSLA | 359.87890846 |

## Wallets

| Role | Public address |
|---|---|
| Wallet A — deployer / creator | `0xe8507D6396C332a891b2eAFa14e34e812fa289D7` |
| Wallet B — trader / counterparty | `0x256d37917FF57DD87cEb558cBB995AffFfB2F2fE` |

Both are freshly generated testnet-only wallets (PHASE 5.5). The earlier deployer wallet
(`0x0973...820f0`) is treated as superseded and exposed: its address appears in git history and
in the pre-hardening docs, and its key has been replaced with an obvious placeholder in
`contracts/.env`. It holds no submission role.

Private keys exist only in the gitignored `contracts/.env` and are never printed, logged,
committed, or included in this document.

## Explorer verification

All three contracts are **source verified** on the Robinhood Chain Testnet explorer.

| Contract | Verification | Explorer |
|---|---|---|
| MockUSDG | ✅ `Pass - Verified` | https://explorer.testnet.chain.robinhood.com/address/0x7ba735a381b9ffe700a8c92558659461b359ee9c |
| ThesisFactory | ✅ `Pass - Verified` | https://explorer.testnet.chain.robinhood.com/address/0x9db674834f4c060114cb53f21e179fc54f905342 |
| Demo ThesisMarket | ✅ `Pass - Verified` (constructor args included) | https://explorer.testnet.chain.robinhood.com/address/0xbf496ef435c814c81864b5f337f23b63d4b26bb3 |

Verification settings that must match exactly:

| Setting | Value |
|---|---|
| Compiler | `v0.8.24` |
| Optimizer | enabled, 200 runs |
| EVM version | `cancun` |
| Verifier | Blockscout (`forge verify-contract --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/`) |

Reproduce any of them:

```bash
cd contracts
forge verify-contract 0x9Db674834F4C060114Cb53f21e179fc54F905342 src/ThesisFactory.sol:ThesisFactory \
  --rpc-url https://rpc.testnet.chain.robinhood.com \
  --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/ \
  --compiler-version 0.8.24 --num-of-optimizations 200 --evm-version cancun
```

Note: the explorer's plain `curl` API is protected by a WAF rule (Cloudflare error 1010), so the
`forge` CLI path above is the reliable route.

## Redeployment history

The contracts were redeployed once after the final hardening pass. The first submission
deployment was superseded because the `ThesisFactory` runtime embeds the market creation
bytecode, so any `ThesisMarket` fix requires a new factory.

| Revision | MockUSDG | ThesisFactory | Status |
|---|---|---|---|
| pre-guard (first submission deploy) | `0xc1A90A395f66920F9927aE9B406Ba5716DAc261f` | `0xCdadF4af7360FF99169936ba95574ABD5e389785` | superseded |
| final (includes empty-winning-pool refund guard) | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` | `0x9Db674834F4C060114Cb53f21e179fc54F905342` | **current** |

Redisployment was mandatory, not cosmetic: a market created by the old factory would keep the
old settlement behaviour.

## Source verification

| Contract | Status |
|---|---|
| ThesisFactory | ✅ verified (`is_verified: true` on the explorer API) |
| Demo ThesisMarket | ✅ verified (constructor args included) |
| MockUSDG | bytecode is **byte-for-byte identical** to the already-verified previous MockUSDG (`cast code` on both addresses is the same 3,770-char runtime), so the deployed source is provably the verified `src/MockUSDG.sol`. The explorer API reports `is_verified: false` for the new address only because Blockscout's re-verification endpoint deduplicates by bytecode and returns "already verified" without attaching the new address. |
