// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ThesisChallengeBase} from "./ThesisChallengeBase.t.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";

contract ThesisChallengeFuzzTest is ThesisChallengeBase {
    function testFuzz_SettlementConservesCollateral(uint96 bondSeed, uint96 challengeSeed, uint16 moveSeed) public {
        uint256 bond = bound(uint256(bondSeed), 1e18, 10_000e18);
        ThesisChallenge thesis = createThesis(bond);
        uint256 challenge = bound(uint256(challengeSeed), 0, bond);
        if (challenge > 0) approveAndChallenge(thesis, faderA, challenge, "Fuzzed challenge.");

        uint256 moveBps = bound(uint256(moveSeed), 0, 30_000);
        advanceToExpiry(thesis);
        uint256 assetAPrice = (200e8 * (10_000 + moveBps)) / 10_000;
        uint256 assetBPrice = (100e8 * (10_000 + moveBps)) / 10_000;
        publishPrices(assetAPrice, assetBPrice, 500e8);
        thesis.settle();

        assertEq(
            thesis.creatorPayout() + thesis.challengePayoutPool(), bond + challenge, "payouts must conserve collateral"
        );
        assertLe(thesis.creatorPayout(), bond + challenge);
        assertLe(thesis.challengePayoutPool(), bond + challenge);
    }

    function testFuzz_ChallengeNeverExceedsOpenBounty(uint96 bondSeed, uint96 first, uint96 second) public {
        uint256 bond = bound(uint256(bondSeed), 1e18, 10_000e18);
        ThesisChallenge thesis = createThesis(bond);
        uint256 firstChallenge = bound(uint256(first), 0, bond);
        if (firstChallenge > 0) approveAndChallenge(thesis, faderA, firstChallenge, "First fuzzed Fade.");
        uint256 remaining = bond - firstChallenge;
        uint256 secondChallenge = bound(uint256(second), 0, remaining);
        if (secondChallenge > 0) approveAndChallenge(thesis, faderB, secondChallenge, "Second fuzzed Fade.");
        assertLe(thesis.challengePool(), thesis.creatorBond());
        assertEq(thesis.openBounty(), bond - firstChallenge - secondChallenge);
    }
}
