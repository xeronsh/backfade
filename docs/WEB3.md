# Web3 Architecture

## Network and configuration

Backfade v0.2 targets Robinhood Chain Testnet, chain ID `46630`, with ETH for gas. RPC, explorer, Factory, collateral, and WalletConnect values are environment-validated. The active v0.2 deployment is recorded in [`DEPLOYMENTS.md`](DEPLOYMENTS.md); historical v0.1 addresses are not reused.

## Wallet boundary

```text
RainbowKit → Wagmi → Viem → Robinhood Chain Testnet
```

The browser wallet signs every transaction. The FastAPI compiler never receives a private key, creates a wallet client, forwards a signed transaction, or holds collateral.

## Reads

`web/src/features/thesis/hooks.ts` reads Factory Thesis addresses, immutable Thesis data, latest oracle values, Challenger stakes, and activity events through Viem multicall and event queries. TanStack Query caches and polls unresolved Theses. The chain is the only canonical source; a partial read fails closed.

Live Alpha is calculated from stored normalized start prices and latest positive feed prices. It is labelled indicative until settlement. Realized Alpha is read from `realizedAlphaBps()` after the contract stores it.

## Writes

Every write follows:

```text
validate → simulate → wallet sign → wait receipt → invalidate queries
```

Actions are:

- Bond & Post through `ThesisFactory.createThesis`;
- Raise Conviction through `ThesisChallenge.raiseConviction`;
- Fade through `ThesisChallenge.challenge`;
- Settle or cancel through permissionless lifecycle methods;
- Claim through the pull-based `claim` method.

ERC20 approval uses the exact required amount. Reverted receipts enter the failed transaction state. There is no page reload or hidden transaction retry.

## Contract source and generated ABI

`ThesisFactory` accepts only deployment-configured canonical collateral and allowlisted feeds. It fixes the challenge window and horizon. `ThesisChallenge` stores the immutable call, start prices, creator bond, Challenge Pool, Alpha, payout pools, claims, and `OPEN`/`LOCKED`/`SETTLED`/`CANCELLED` state.

ABIs are generated from Foundry source by `scripts/codegen/contracts.mjs` into `web/src/generated/contracts.ts`. Hand-copied ABI and API interfaces are not used by v0.2.
