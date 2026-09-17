# Live E2E — v0.2 Social Alpha

## Status

The earlier v0.2 deployment and Creator → Challenger flow are live on Robinhood Chain Testnet. Its verified feeds did not publish a post-expiry observation inside the bounded window, so that Thesis was safely cancelled and all three principal claims completed. The current fresh settlement candidate is recorded below and remains pending until the verified feeds publish a safe post-expiry observation.

A previous short-window run is also recorded below. It reached safe `CANCELLED` and completed all three pull claims, proving the same failure-safe path.

The original v0.1-binary deployment/E2E record is preserved verbatim at [`archive/v0.1-binary/LIVE_E2E.md`](archive/v0.1-binary/LIVE_E2E.md); v0.2 evidence is kept separate.

The successful settlement path is covered separately by the wallet-backed local E2E below. It uses a fresh Anvil chain and does not turn ephemeral local transaction hashes into testnet evidence.

## Wallet-backed local settlement evidence

`make e2e` starts Anvil, deploys the v0.2 factory and verified-feed mocks with Forge, and serves the real app/API. The Chromium and Firefox suite then uses an injected browser wallet to:

1. create a Thesis with the Creator's USDG bond;
2. approve and post two funded Challenges with separate Challenger accounts;
3. advance local time, publish fresh post-expiry feed observations, and settle;
4. claim as the Creator and both Challengers.

The test asserts `state == SETTLED`, one `ThesisSettled` log, three `Claimed` logs, `totalClaimed == 1,500 USDG`, and a zero Thesis collateral balance. The latest run completed `14 passed` across Chromium and Firefox. This is genuine local wallet/RPC evidence; the live testnet record below remains cancellation-only until its verified feeds publish a safe post-expiry observation.

## Fresh live settlement candidate

A new v0.2 factory and Thesis were deployed on Robinhood Chain Testnet while preparing the settlement run:

| Item | Address / transaction |
|---|---|
| MockUSDG | `0x84C5f600720532f71009dd2cBED168e766383eE8` · [`0x04ef0d163d6968fb8d5f9030a92504bbf1c1cdbf549f84cce66d87176000a515`](https://explorer.testnet.chain.robinhood.com/tx/0x04ef0d163d6968fb8d5f9030a92504bbf1c1cdbf549f84cce66d87176000a515) |
| ThesisFactory | `0x841Ec0cBBD931243e8d973BaC9854eE1a4a65D94` · [`0xec7266b35e17d344cba1314cab93b0445fa0decc545a22b7820a3929c9bb1ffa`](https://explorer.testnet.chain.robinhood.com/tx/0xec7266b35e17d344cba1314cab93b0445fa0decc545a22b7820a3929c9bb1ffa) |
| Thesis | `0x914345586A1fb1598BFB371DA5cca53614ff91C7` · [`0x41773707b7f2844349d268b16a0d8e687d79283c0907efa6ebf52b9f56b59f96`](https://explorer.testnet.chain.robinhood.com/tx/0x41773707b7f2844349d268b16a0d8e687d79283c0907efa6ebf52b9f56b59f96) |
| Challenges | `0x8c7a47833e74eaa16a13c866093c31050a2b480ec89294656f8394a4495754b7` · `0xbd26fbdc670bf592cddb4f61df1a6eafc7d42018629429d70377f7efe65e7de1` |

The candidate uses a `45 s` Challenge window, `28,800 s` horizon, `1,800 s` settlement window, and a `172,800 s` maximum start-price age. It is not represented as settled until all three verified feeds publish observations in the contract's post-expiry window. After the claims complete, `make live-check` verifies the onchain `SETTLED` state, one `ThesisSettled` log, three `Claimed` logs, `totalClaimed`, and the zero collateral balance.

## Earlier v0.2 deployment and cancellation record

| Field | Value |
|---|---|
| Network | Robinhood Chain Testnet |
| Chain ID | `46630` |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| MockUSDG | `0x222903b08139FeeF6C0CAD921e0f2F7f5Eb81AB6` |
| ThesisFactory | `0x49a9CF7661aAB5B658A5c19420993Fcf00841d2a` |
| ThesisChallenge | `0x1Ba1F165d3823188500e47C5fE9c41aBC88F3b30` |
| Challenge window | `45 s` |
| Horizon | `47,000 s` |
| Settlement window | `1,800 s` (`30 min`) |
| Maximum start-price age | `86,400 s` (`24 h`) |

The earlier deployment used only the verified allowlisted AMD, PLTR, NVDA, TSLA, and COIN feeds. The API enables exactly this set; no unsupported crypto feed is substituted.

## Earlier Creator → Challenger evidence

Creator `0xe8507D6396C332a891b2eAFa14e34e812fa289D7` posted:

> AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA reference.

| Step | Transaction | Result |
|---|---|---|
| `ThesisCreated` / Bond & Post | [`0x4025bf8faf5eeded00a631368fb0fbfa7f6ccb641a69bd8a73f20609e523235f`](https://explorer.testnet.chain.robinhood.com/tx/0x4025bf8faf5eeded00a631368fb0fbfa7f6ccb641a69bd8a73f20609e523235f) | `creatorBond = 1,000 USDG` |
| `ChallengePosted` A | [`0xd20b3ddf8176e1b1d16a6a0a01adbeb85253b557b74f9c5873c2263043e6c72f`](https://explorer.testnet.chain.robinhood.com/tx/0xd20b3ddf8176e1b1d16a6a0a01adbeb85253b557b74f9c5873c2263043e6c72f) | `300 USDG`, note recorded |
| `ChallengePosted` B | [`0xfeb79767732870638d6789e86261defb9e3f065633fab5850cb6c952e4ed6fb5`](https://explorer.testnet.chain.robinhood.com/tx/0xfeb79767732870638d6789e86261defb9e3f065633fab5850cb6c952e4ed6fb5) | `200 USDG`, note recorded |

The earlier Thesis read-back was:

```text
creatorBond       = 1000000000000000000000
challengePool     = 500000000000000000000
openBounty        = 500000000000000000000
matchedConviction = 500000000000000000000
state             = LOCKED
challengeEndsAt   = 1789555630
resolvesAt        = 1789602585
settlementWindow  = 1800
```

Start prices were captured from the verified feeds at creation:

```text
AMD  = 503920000000000000000
PLTR = 172100000000000000000
TSLA = 358039999990000000000
```

## Settlement gate and observed result

At settlement, every feed must satisfy:

```text
resolvesAt <= updatedAt <= resolvesAt + settlementWindow
```

AMD, PLTR, and TSLA did not publish observations with `updatedAt >= resolvesAt` before the earlier deadline. Calling `settle()` on stale data would have been unsafe, so the valid fallback was used:

| Step | Transaction | Result |
|---|---|---|
| `ThesisCancelled` | [`0x472fffa4873087169e64c3b48ac4c316939b525c6cae293653c6fb65314f8426`](https://explorer.testnet.chain.robinhood.com/tx/0x472fffa4873087169e64c3b48ac4c316939b525c6cae293653c6fb65314f8426) | Alpha `0`, refunds enabled |
| Creator `Claimed` | [`0xb4ec5b012d5aad5897d54a2289cbb2f75ee4ece5473bf7e83111e0ed401b6195`](https://explorer.testnet.chain.robinhood.com/tx/0xb4ec5b012d5aad5897d54a2289cbb2f75ee4ece5473bf7e83111e0ed401b6195) | `1,000 USDG` |
| Challenger A `Claimed` | [`0xfe30346546f15ce516b521f57d1cf6b62f9a43d599f013edb87b135b573da1e2`](https://explorer.testnet.chain.robinhood.com/tx/0xfe30346546f15ce516b521f57d1cf6b62f9a43d599f013edb87b135b573da1e2) | `300 USDG` |
| Challenger B `Claimed` | [`0x18e7277642f401ab4debc95f0b11fa02689d803d0268f9511ea7524a21edcecd`](https://explorer.testnet.chain.robinhood.com/tx/0x18e7277642f401ab4debc95f0b11fa02689d803d0268f9511ea7524a21edcecd) | `200 USDG` |

The final earlier Thesis balance was `0 USDG`. This is live cancellation and pull-claim evidence, not successful settlement evidence. A `ThesisSettled` event must not be fabricated from stale feeds.

## Previous safe-cancellation evidence

The previous v0.2 attempt used Thesis `0x84E6841b3B1dC270F3Fd46326232AdC5437c806b` with a `500 USDG` bond and two Challenges of `300` and `200 USDG`. Its feeds did not print after expiry, so it was cancelled:

| Step | Transaction | Result |
|---|---|---|
| `ThesisCancelled` | `0x9b4f854f5bf51704c78a54b07a8a23bf0e03851c686834e55493385281b307a1` | Alpha `0`, refunds enabled |
| Creator `Claimed` | `0x24c14adfa4ad70255f6bc6bbe8f4ea286a979012cb824ce4ed7fdd4cb8ea1628` | `500 USDG` |
| Challenger A `Claimed` | `0x9638cc9c751e9ec12ffbabc00cc463f7c4a3bebaa6637c9f9393c39b1185ceb4` | `300 USDG` |
| Challenger B `Claimed` | `0x3ff59afa118c12dce73eb5d928de820960f4d75b5c7f6b56651e99b644ab1980` | `200 USDG` |

The previous Thesis contract balance finished at `0 USDG`. This is live cancellation/claim evidence, not successful settlement evidence.

## Reproduction

```bash
RPC=https://rpc.testnet.chain.robinhood.com
THESIS=0x1Ba1F165d3823188500e47C5fE9c41aBC88F3b30
cast call $THESIS 'state()(uint8)' --rpc-url $RPC
cast call $THESIS 'challengePool()(uint256)' --rpc-url $RPC
cast call $THESIS 'openBounty()(uint256)' --rpc-url $RPC
cast call 0x5406FC983e7f84B544FF6fc855e06c22Cf36A795 \
  'latestRoundData()(uint80,int256,uint256,uint256,uint80)' --rpc-url $RPC
```

The deterministic local version of the full lifecycle, including settlement, pro-rata claims, cancellation, and rounding invariants, is covered by `forge test --root contracts` and the contract tests under `contracts/test/`. That local evidence does not replace the active live settlement gate.
