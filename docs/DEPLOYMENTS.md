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

## Fresh v0.2 settlement attempt (safely cancelled)

This v0.2 deployment was used for the first bounded live settlement attempt. Its `8 h` horizon placed expiry after the next verified stock-feed window. The `48 h` maximum start age was explicit because the feeds' last verified observations were more than 24 h old at creation; no unverified or fabricated price was used.

| Setting | Value |
|---|---:|
| Challenge window | `45 s` |
| Horizon | `28,800 s` (`8 h`) |
| Settlement window | `1,800 s` (`30 min`) |
| Maximum start-price age | `172,800 s` (`48 h`) |

| Contract | Address | Deployment transaction |
|---|---|---|
| MockUSDG | `0x84C5f600720532f71009dd2cBED168e766383eE8` | [`0x04ef0d163d6968fb8d5f9030a92504bbf1c1cdbf549f84cce66d87176000a515`](https://explorer.testnet.chain.robinhood.com/tx/0x04ef0d163d6968fb8d5f9030a92504bbf1c1cdbf549f84cce66d87176000a515) |
| ThesisFactory | `0x841Ec0cBBD931243e8d973BaC9854eE1a4a65D94` | [`0xec7266b35e17d344cba1314cab93b0445fa0decc545a22b7820a3929c9bb1ffa`](https://explorer.testnet.chain.robinhood.com/tx/0xec7266b35e17d344cba1314cab93b0445fa0decc545a22b7820a3929c9bb1ffa) |

| Thesis | Address | Create transaction |
|---|---|---|
| Fresh settlement candidate | `0x914345586A1fb1598BFB371DA5cca53614ff91C7` | [`0x41773707b7f2844349d268b16a0d8e687d79283c0907efa6ebf52b9f56b59f96`](https://explorer.testnet.chain.robinhood.com/tx/0x41773707b7f2844349d268b16a0d8e687d79283c0907efa6ebf52b9f56b59f96) |

The candidate had a `1,000 USDG` Creator bond and two funded Challenges of `300 USDG` and `200 USDG`. Challenge A was [`0x8c7a47833e74eaa16a13c866093c31050a2b480ec89294656f8394a4495754b7`](https://explorer.testnet.chain.robinhood.com/tx/0x8c7a47833e74eaa16a13c866093c31050a2b480ec89294656f8394a4495754b7); Challenge B was [`0xbd26fbdc670bf592cddb4f61df1a6eafc7d42018629429d70377f7efe65e7de1`](https://explorer.testnet.chain.robinhood.com/tx/0xbd26fbdc670bf592cddb4f61df1a6eafc7d42018629429d70377f7efe65e7de1). No verified post-expiry observations arrived before the deadline, so it was safely cancelled and all principal was claimed.

| Step | Transaction | Result |
|---|---|---|
| `ThesisCancelled` | [`0x2bf95ad27639dbbecf50f96a8b47e0fd6a7cd85bcc3844a3063a3064a886c06a`](https://explorer.testnet.chain.robinhood.com/tx/0x2bf95ad27639dbbecf50f96a8b47e0fd6a7cd85bcc3844a3063a3064a886c06a) | refunds enabled |
| Creator `Claimed` | [`0x3ed2c89772dfffa3c5921bd765f489e3d254d4cde01c13af0ed957d75f5f9b2f`](https://explorer.testnet.chain.robinhood.com/tx/0x3ed2c89772dfffa3c5921bd765f489e3d254d4cde01c13af0ed957d75f5f9b2f) | `1,000 USDG` |
| Challenger A `Claimed` | [`0x5bbcc059ac7006e8f5aeba7629ec109695111ffcb23368d1d25af98571cf6812`](https://explorer.testnet.chain.robinhood.com/tx/0x5bbcc059ac7006e8f5aeba7629ec109695111ffcb23368d1d25af98571cf6812) | `300 USDG` |
| Challenger B `Claimed` | [`0x6c505219e3f3d91994ce0df65758c753a59863ca30e39cf4cf54efffed15490d`](https://explorer.testnet.chain.robinhood.com/tx/0x6c505219e3f3d91994ce0df65758c753a59863ca30e39cf4cf54efffed15490d) | `200 USDG` |

The final Thesis collateral balance was `0 USDG`; `totalClaimed` was `1,500 USDG`. This is live cancellation evidence, not settlement evidence.

## Next fresh v0.2 settlement candidate

A second fresh v0.2 Factory and Thesis were deployed with the same canonical MockUSDG and verified AMD/PLTR/TSLA feeds. Its `22 h` horizon aligns expiry with the next measured verified-feed window; the `48 h` maximum start age remains explicit because the creation prices were observed onchain and were still inside that bound. This candidate is monitored separately from the cancelled attempt above.

| Setting | Value |
|---|---:|
| Challenge window | `45 s` |
| Horizon | `79,200 s` (`22 h`) |
| Settlement window | `1,800 s` (`30 min`) |
| Maximum start-price age | `172,800 s` (`48 h`) |

| Contract | Address | Deployment transaction |
|---|---|---|
| MockUSDG | `0x256049FCac7349bd037fecb4D849be2610392Ee1` | [`0xa7208442fea55ab730cdc6f9ac739d583b8ac406356ce54ea72482b5dfcff419`](https://explorer.testnet.chain.robinhood.com/tx/0xa7208442fea55ab730cdc6f9ac739d583b8ac406356ce54ea72482b5dfcff419) |
| ThesisFactory | `0xc37c86C7c59790342381a7c64eBF23fba6686375` | [`0x65e3ed3be6674e98faebdc52c71a4175d802a52c949b2c984374622e78478b04`](https://explorer.testnet.chain.robinhood.com/tx/0x65e3ed3be6674e98faebdc52c71a4175d802a52c949b2c984374622e78478b04) |

| Thesis | Address | Create transaction |
|---|---|---|
| Next settlement candidate | `0x12404Ce775a22532bE58e0105252819A982cFB21` | [`0x329a31fef3a7132ed9748efe84e2addf3ef9becd0c97dc862d1ed5ac2f07c47e`](https://explorer.testnet.chain.robinhood.com/tx/0x329a31fef3a7132ed9748efe84e2addf3ef9becd0c97dc862d1ed5ac2f07c47e) |

The candidate has a `1,000 USDG` Creator bond, `challengeEndsAt = 1789661152`, `resolvesAt = 1789740307`, and two funded Challenges. Challenge A (`300 USDG`) is [`0x3bde8925fa9bd0a4f7f50e5d328df0235316f5069e95d6136d64449d020e825f`](https://explorer.testnet.chain.robinhood.com/tx/0x3bde8925fa9bd0a4f7f50e5d328df0235316f5069e95d6136d64449d020e825f); Challenge B (`200 USDG`) is [`0x9fa0ed125813d393ad4ca1c2be7502682a4ec8a67ca4724a93c13e7e2e353b07`](https://explorer.testnet.chain.robinhood.com/tx/0x9fa0ed125813d393ad4ca1c2be7502682a4ec8a67ca4724a93c13e7e2e353b07). It remains a separate `LOCKED` follow-up probe with `challengePool = 500 USDG`; it is not used as successful settlement evidence under the revised acceptance.

## Earlier v0.2 Social Alpha deployment (cancelled)

This earlier fresh deployment was used for the first live settlement attempt. Its `13.06 h` horizon was deliberate: the verified testnet equity feeds publish in a daily window, so expiry was placed immediately before the next window. The product-shaped defaults remain `30 minutes` challenge window and `7 days` horizon in `contracts/script/Deploy.s.sol`.

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

The exact source baseline is tagged `v0.1-binary` at `556fcabe91221b9ff348f9e8ffd4d31f9a570549`. Historical deployment evidence remains available from the baseline commit and is not presented as v0.2 behavior. The original deployment record is preserved verbatim at [`archive/v0.1-binary/DEPLOYMENTS.md`](archive/v0.1-binary/DEPLOYMENTS.md).

## Deployment commands

```bash
cd contracts
DEPLOYER_PK="$DEPLOYER_PRIVATE_KEY" forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.testnet.chain.robinhood.com --broadcast
```

Private keys are read from ignored local environment files and never belong in this document.
