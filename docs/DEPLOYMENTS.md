# Robinhood Chain Testnet Deployments

- Network: **Robinhood Chain Testnet**, Chain ID **46630**
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`
- Deploy date: 2026-09-14
- Git commit: see `git log` (efac486+)

| Contract | Address | Verified |
|---|---|---|
| MockUSDG (collateral) | `0xf910f0e62868c8479a25aa34fb407bc4ef66c112` | ✅ |
| ThesisFactory | `0x49e769a20fb4b7ced6c31f94402f555038bd7e8f` | ✅ |
| Demo ThesisMarket | `0x0a9c3c881aA3df08bDaEEC8f283e09c5aa532334` | ✅ |

Deployer / creator public address: `0x0973104738884C05F8dF85DCd007daf9609820f0`

## Verified testnet price feeds (Chainlink-compatible AggregatorV3)

See [TESTNET_ASSETS.md](TESTNET_ASSETS.md) for the full verification table.

| Symbol | Feed |
|---|---|
| TSLA | `0x81b48EC24970aA75Ae940e2492fdA006071aC31B` |
| AMZN | `0x8D165612B0d63416141833834257386586f34224` |
| PLTR | `0x84206ED5EBF05B1519486742344d0499Df875Bd0` |
| AMD | `0x5406FC983e7f84B544FF6fc855e06c22Cf36A795` |
| NVDA | `0xBf15aA8CB0f376DB8fcb309347CB7375567bEC6B` |

Note: official Chainlink Stock-Token feed proxies (per docs.chain.link) are mainnet-only today;
the testnet ecosystem ships seeded AggregatorV3-compatible feeds (pushed via `setAnswer`),
which this demo consumes. No secrets are stored in this repo.
