# Robinhood Chain Testnet (46630) — Verified Price Feeds

> Verified via live RPC `https://rpc.testnet.chain.robinhood.com` on 2026-09-14.
> Each feed was probed onchain: `decimals()`, `description()`, `latestRoundData()` — answer > 0, updatedAt > 0.
> These are Chainlink-compatible AggregatorV3 mock/seeded feeds maintained by the testnet ecosystem (pushed via `setAnswer`).
> Official Chainlink Stock-Token feed proxies exist on MAINNET (4663) only — verified live there (TSLA $358.22, NVDA $212.54, PLTR $168.07) but absent on testnet.

| Symbol | Feed address | Decimals | Description | Latest price | Latest updatedAt | Verification command | Status |
|---|---|---|---|---|---|---|---|
| TSLA | `0x81b48EC24970aA75Ae940e2492fdA006071aC31B` | 8 | "TSLA / USD (testnet)" | $359.40 | 1789376578 | `cast call 0x81b48EC24970aA75Ae940e2492fdA006071aC31B "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| AMZN | `0x8D165612B0d63416141833834257386586f34224` | 8 | "AMZN / USD (testnet)" | $254.07 | 1789376658 | `cast call 0x8D165612B0d63416141833834257386586f34224 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| PLTR | `0x84206ED5EBF05B1519486742344d0499Df875Bd0` | 8 | "PLTR / USD (testnet)" | $167.96 | 1789376498 | `cast call 0x84206ED5EBF05B1519486742344d0499Df875Bd0 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| AMD | `0x5406FC983e7f84B544FF6fc855e06c22Cf36A795` | 8 | "AMD / USD (testnet)" | $489.79 | 1789376659 | `cast call 0x5406FC983e7f84B544FF6fc855e06c22Cf36A795 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| NVDA | `0xBf15aA8CB0f376DB8fcb309347CB7375567bEC6B` | 8 | "NVDA / USD (testnet)" | $212.41 | 1789376658 | `cast call 0xBf15aA8CB0f376DB8fcb309347CB7375567bEC6B "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| GME | `0x7ca5707aCC7a2B87c16B60848fb2582311BE3b4f` | 8 | "GME / USD (testnet)" | $20.98 | 1789376696 | `cast call 0x7ca5707aCC7a2B87c16B60848fb2582311BE3b4f "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| AAPL | `0x139C8342c1A138817D0A83872881CC8CEC183749` | 8 | "AAPL / USD (testnet)" | $330.88 | 1789376694 | `cast call 0x139C8342c1A138817D0A83872881CC8CEC183749 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| NFLX | `0x5ca7a619217e5eFFD9B57Ba58CC5981AEcE1Bec6` | 8 | "NFLX / USD (testnet)" | $77.61 | 1789376587 | `cast call 0x5ca7a619217e5eFFD9B57Ba58CC5981AEcE1Bec6 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| META | `0xA022D2d137fE6E8980666DB672CB92005A8A78B9` | 8 | "META / USD (testnet)" | $639.49 | 1789376696 | `cast call 0xA022D2d137fE6E8980666DB672CB92005A8A78B9 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| COIN | `0x1f1699510abfdAd90D82e2624136224B6b4EC7C8` | 8 | "COIN / USD (testnet)" | $176.10 | 1789376696 | `cast call 0x1f1699510abfdAd90D82e2624136224B6b4EC7C8 "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |
| ETH | `0xfd8ADe2E2a8AE0645b9eC1473b65579A5456553E` | 8 | "ETH / USD (testnet)" | $2,516.47 | 1789376690 | `cast call 0xfd8ADe2E2a8AE0645b9eC1473b65579A5456553E "latestRoundData()(uint80,int256,uint256,uint256,uint80)" --rpc-url $RH_TESTNET_RPC` | PASS |

## Rejected

| Address | Reason |
|---|---|
| Mainnet proxies (e.g. `0x4A1166…7C38` TSLA) | no code on 46630 (`eth_getCode` empty) — DO NOT use on testnet |
