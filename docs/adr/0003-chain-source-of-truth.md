# ADR 0003: Chain as the source of truth

## Decision

Keep financial state on Robinhood Chain Testnet. Use TanStack Query only as an ephemeral read cache.
Do not add a database or indexer at the current scale.

## Why

Markets, positions, outcomes, and collateral balances already have canonical contract state and
multicall access. A second financial store would add drift and reconciliation risk.
