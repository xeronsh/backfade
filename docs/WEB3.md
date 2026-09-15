# Web3 Architecture

## Network

The app targets Robinhood Chain Testnet, chain ID `46630`, with ETH as the native currency.
RPC and explorer configuration is environment validated. Current deployed contract addresses are
canonical in [`DEPLOYMENTS.md`](DEPLOYMENTS.md); feature components never hardcode them.

## Wallet stack

```text
RainbowKit → Wagmi → Viem → Robinhood Chain Testnet
```

RainbowKit provides wallet discovery, injected/EIP-6963 connectors, WalletConnect, account state,
connect/disconnect, and network UX. The UI uses `ConnectButton.Custom` so wallet actions match the
Backfade design system. There is no `window.ethereum.request()` application flow and no global
`currentAccount` state.

The browser wallet signs every transaction. The backend never receives a private key, creates a
wallet client, forwards a signed transaction, or holds custody.

## Contract source and reads

ABIs are generated from Foundry artifacts by `scripts/codegen/contracts.mjs` into
`web/src/generated/contracts.ts`. No hand-copied ABI is a source of truth. CI runs the ABI parity
gate after regeneration.

Factory market addresses and market fields are read with Viem multicall through the Wagmi public
client. TanStack Query caches those reads ephemerally. Refreshing reconstructs state from the
chain; browser storage is never canonical market storage.

## Transaction lifecycle

All writes use the shared transaction state machine:

```text
IDLE → VALIDATING → SIMULATING → wallet signature → PENDING → receipt → CONFIRMED
                                             └──────────────→ FAILED
```

Approval uses the exact required token amount. A successful receipt invalidates affected query
keys; there is no timeout-based refresh and no page reload. Sonner reports action, wallet/network
step, pending, confirmation, failure, and explorer link.

## Market actions

The frontend derives OPEN, CLOSED, READY, CANCELLABLE, PROVEN, FAILED, and CANCELLED through one
pure function. Resolve, cancel, claim, refund, BACK, and FADE are only offered when the derived
state permits them. Settlement semantics remain in the frozen contracts.
