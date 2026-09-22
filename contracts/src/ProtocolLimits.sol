// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Limits shared by `ThesisFactory` and every `ThesisChallenge` it deploys.
//
// These live at file scope because a `ContractName.CONSTANT` lookup does not
// resolve in Solidity. When each contract declared its own copy, the narrative
// cap drifted: the factory hardcoded `280` while the thesis used its constant.
// One declaration removes that class of bug.

uint256 constant MAX_BASKET_ASSETS = 5;
uint256 constant WEIGHTS_TOTAL_BPS = 10_000;

// A Thesis states an opinion at length. A Challenge note argues back briefly,
// so the two deliberately do not share one limit.
uint256 constant NARRATIVE_MAX_BYTES = 2_000;
uint256 constant NOTE_MAX_BYTES = 280;

// Bounds on the creator's chosen payout range. A narrower range moves more
// Challenge Pool per unit of Realized Alpha, so it is leverage by another name.
uint256 constant MIN_PAYOUT_RANGE_BPS = 100;
uint256 constant MAX_PAYOUT_RANGE_BPS = 5_000;
