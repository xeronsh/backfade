# ADR 0002: RainbowKit + Wagmi + Viem

## Decision

Use RainbowKit for wallet UX, Wagmi for React/Web3 state, and Viem for Ethereum-compatible reads,
writes, simulation, receipts, and encoding.

## Why

Wallet discovery, network handling, query integration, and contract typing are generic complexity.
The product owns only Backfade-specific market semantics and transaction presentation.
