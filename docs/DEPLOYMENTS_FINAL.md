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
| Runtime sizes | MockUSDG 1,884 B · ThesisFactory 15,068 B · ThesisMarket 7,943 B (limit 24,576 B) |
| EVM version | cancun |

## Contracts

| Contract | Address | Deploy Tx |
|---|---|---|
| MockUSDG | `0xc1A90A395f66920F9927aE9B406Ba5716DAc261f` | see `contracts/broadcast/DeployFinal.s.sol/46630/` |
| ThesisFactory | `0xCdadF4af7360FF99169936ba95574ABD5e389785` | see `contracts/broadcast/DeployFinal.s.sol/46630/` |

## Demo market

| Field | Value |
|---|---|
| ThesisMarket | `0x3655ACF4C91029D94E3aE29A2D7E794a42Da795C` |
| Narrative | AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark. |
| Basket | AMD 60% + PLTR 40% |
| Benchmark | TSLA |
| Hurdle | +1000 bps (10%) |
| Settlement window | 1800 s (30 min, factory default) |
| Start AMD | 494.815 |
| Start PLTR | 172.86769095 |
| Start TSLA | 359.85676128 |

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
| MockUSDG | ✅ `Pass - Verified` | https://explorer.testnet.chain.robinhood.com/address/0xc1a90a395f66920f9927ae9b406ba5716dac261f |
| ThesisFactory | ✅ `Pass - Verified` | https://explorer.testnet.chain.robinhood.com/address/0xcdadf4af7360ff99169936ba95574abd5e389785 |
| Demo ThesisMarket | ✅ `Pass - Verified` (constructor args included) | https://explorer.testnet.chain.robinhood.com/address/0x3655acf4c91029d94e3ae29a2d7e794a42da795c |

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
forge verify-contract 0xCdadF4af7360FF99169936ba95574ABD5e389785 src/ThesisFactory.sol:ThesisFactory \
  --rpc-url https://rpc.testnet.chain.robinhood.com \
  --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/ \
  --compiler-version 0.8.24 --num-of-optimizations 200 --evm-version cancun
```

Note: the explorer's plain `curl` API is protected by a WAF rule (Cloudflare error 1010), so the
`forge` CLI path above is the reliable route.
