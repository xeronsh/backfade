# Deployments — Robinhood Chain Testnet

## Network

| Field | Value |
|---|---|
| Network | Robinhood Chain Testnet |
| Chain ID | `46630` |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Explorer | `https://explorer.testnet.chain.robinhood.com` |
| Solidity | `0.8.24` |
| Optimizer | enabled, 200 runs |
| Collateral | MockUSDG, testnet only |

## Active v0.2 Social Alpha deployment

This is the fresh deployment used for the live settlement attempt. Its `13.06 h` horizon is deliberate: the verified testnet equity feeds publish in a daily window, so expiry is placed immediately before the next window. The product-shaped defaults remain `30 minutes` challenge window and `7 days` horizon in `contracts/script/Deploy.s.sol`.

| Setting | Value |
|---|---:|
| Challenge window | `45 s` |
| Horizon | `47,000 s` |
| Settlement window | `1,800 s` (`30 min`) |
| Maximum start-price age | `86,400 s` (`24 h`) |
| Payout transfer range | `±1,000 bps` |

| Contract | Address | Deployment transaction |
|---|---|---|
| MockUSDG | `0x222903b08139FeeF6C0CAD921e0f2F7f5Eb81AB6` | [`0x09bfd101386e77a8577ccfcca128c0a27a84bf5611eb665d16dfa5cd4507537c`](https://explorer.testnet.chain.robinhood.com/tx/0x09bfd101386e77a8577ccfcca128c0a27a84bf5611eb665d16dfa5cd4507537c) |
| ThesisFactory | `0x49a9CF7661aAB5B658A5c19420993Fcf00841d2a` | [`0x3c26c89ce315a7d7706357e567bc9804718479c4190ee74ca857de9f4d8bb7b7`](https://explorer.testnet.chain.robinhood.com/tx/0x3c26c89ce315a7d7706357e567bc9804718479c4190ee74ca857de9f4d8bb7b7) |

The active allowlist is AMD, PLTR, NVDA, TSLA, and COIN. The API enables exactly those deployed feeds; verified AAPL and GME registry entries remain disabled until a Factory is deployed with them.

## v0.2 live Thesis run (safely cancelled)

| Field | Value |
|---|---|
| Thesis | `0x1Ba1F165d3823188500e47C5fE9c41aBC88F3b30` |
| Creator | `0xe8507D6396C332a891b2eAFa14e34e812fa289D7` |
| Creator bond | `1,000 USDG` |
| Challenge Pool | `500 USDG` |
| Open Bounty | `500 USDG` |
| Matched Conviction | `500 USDG` |
| Challenge window end | `1789555630` |
| Resolve time | `1789602585` |
| Create transaction | [`0x4025bf8faf5eeded00a631368fb0fbfa7f6ccb641a69bd8a73f20609e523235f`](https://explorer.testnet.chain.robinhood.com/tx/0x4025bf8faf5eeded00a631368fb0fbfa7f6ccb641a69bd8a73f20609e523235f) |
| Challenge A (`300 USDG`) | [`0xd20b3ddf8176e1b1d16a6a0a01adbeb85253b557b74f9c5873c2263043e6c72f`](https://explorer.testnet.chain.robinhood.com/tx/0xd20b3ddf8176e1b1d16a6a0a01adbeb85253b557b74f9c5873c2263043e6c72f) |
| Challenge B (`200 USDG`) | [`0xfeb79767732870638d6789e86261defb9e3f065633fab5850cb6c952e4ed6fb5`](https://explorer.testnet.chain.robinhood.com/tx/0xfeb79767732870638d6789e86261defb9e3f065633fab5850cb6c952e4ed6fb5) |

The feeds did not publish a post-expiry observation inside the bounded window. The Thesis was safely cancelled and all three principal claims completed; `LIVE_E2E.md` records the evidence. No stale observation was accepted.

| Step | Transaction |
|---|---|
| `ThesisCancelled` | [`0x472fffa4873087169e64c3b48ac4c316939b525c6cae293653c6fb65314f8426`](https://explorer.testnet.chain.robinhood.com/tx/0x472fffa4873087169e64c3b48ac4c316939b525c6cae293653c6fb65314f8426) |
| Creator `Claimed` | [`0xb4ec5b012d5aad5897d54a2289cbb2f75ee4ece5473bf7e83111e0ed401b6195`](https://explorer.testnet.chain.robinhood.com/tx/0xb4ec5b012d5aad5897d54a2289cbb2f75ee4ece5473bf7e83111e0ed401b6195) |
| Challenger A `Claimed` | [`0xfe30346546f15ce516b521f57d1cf6b62f9a43d599f013edb87b135b573da1e2`](https://explorer.testnet.chain.robinhood.com/tx/0xfe30346546f15ce516b521f57d1cf6b62f9a43d599f013edb87b135b573da1e2) |
| Challenger B `Claimed` | [`0x18e7277642f401ab4debc95f0b11fa02689d803d0268f9511ea7524a21edcecd`](https://explorer.testnet.chain.robinhood.com/tx/0x18e7277642f401ab4debc95f0b11fa02689d803d0268f9511ea7524a21edcecd) |

## Previous v0.2 deployment attempt

This deployment is retained as an observed cancellation run, not silently overwritten:

| Contract | Address |
|---|---|
| MockUSDG | `0xAfDB01Bd1D89c4d24C479865948F9c36C43eC1B3` |
| ThesisFactory | `0x9a9adD5032432f9884341B536682e35179aC6474` |
| Thesis | `0x84E6841b3B1dC270F3Fd46326232AdC5437c806b` |

It used `45 s / 120 s / 180 s / 86,400 s` (`challenge / horizon / settlement / start age`). The feeds did not publish inside its short settlement window. `LIVE_E2E.md` records its safe cancellation, three `Claimed` transactions, and final zero balance.

## v0.1 historical deployment

These addresses and semantics are preserved as historical evidence only. They are not the v0.2 configuration and are not rewritten in place.

| Contract | Historical address |
|---|---|
| MockUSDG | `0x7BA735a381B9FFe700a8c92558659461b359ee9c` |
| ThesisFactory | `0x9Db674834F4C060114Cb53f21e179fc54F905342` |
| Demo ThesisMarket | `0xBf496Ef435C814C81864b5F337F23b63D4b26BB3` |

The exact source baseline is tagged `v0.1-binary` at `556fcabe91221b9ff348f9e8ffd4d31f9a570549`. Historical deployment evidence remains available from the baseline commit and is not presented as v0.2 behavior.

## Deployment commands

```bash
cd contracts
DEPLOYER_PK="$DEPLOYER_PRIVATE_KEY" forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.testnet.chain.robinhood.com --broadcast
```

Private keys are read from ignored local environment files and never belong in this document.
