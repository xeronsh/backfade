# Roadmap

This document records ideas that are deliberately outside the current platform engineering scope.
They are not implemented by the frontend migration.

## Protocol v0.2 ideas

- Asset and collateral registries
- Canonical collateral and protocol versioning
- EIP-1167 market clones
- Mainnet settlement sources and Data Streams
- Duration hard bounds and richer events
- Capture-bond cleanup and rounding-dust refinement

## Product ideas

- Search, comments, follows, notifications, watchlists, and private settings
- Creator track record and reputation formula
- Activity feeds and charts
- Larger-feed virtualization or an indexer when chain reads become the bottleneck
- Embedded wallets for non-crypto-native onboarding
- Mainnet deployment

## Infrastructure triggers

A database is only reconsidered for durable offchain user state such as drafts, comments, follows,
notifications, saved searches, or settings. A queue, Redis, or service split is only reconsidered
when a measured production workload requires it. Observability beyond structured logs is deferred
until the app is publicly operated.
