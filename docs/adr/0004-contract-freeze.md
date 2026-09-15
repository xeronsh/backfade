# ADR 0004: Freeze the submitted contracts

## Decision

Treat `contracts/src/` and the current verified deployment as read-only during platform
engineering.

## Why

A Solidity change would require redeployment, source verification, live E2E reruns, new addresses,
and documentation updates. Only a critical security or funds-at-risk bug may reopen this gate, and
that requires explicit approval before any contract edit.
