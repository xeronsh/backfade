// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ThesisChallengeBase} from "./ThesisChallengeBase.t.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";

contract ThesisChallengeTest is ThesisChallengeBase {
    function test_CreatesImmutableRelativeThesis() public {
        ThesisChallenge thesis = createDefaultThesis();

        assertEq(thesis.narrative(), "A capital-backed thesis about relative performance.");
        assertEq(thesis.creator(), creator);
        assertEq(address(thesis.collateral()), address(usdg));
        assertEq(thesis.referenceFeed(), address(refFeed));
        assertEq(thesis.creatorBond(), BOND);
        assertEq(thesis.challengePool(), 0);
        assertEq(thesis.openBounty(), BOND);
        assertEq(thesis.matchedConviction(), 0);
        assertEq(thesis.basketLength(), 2);
        (address feed, uint16 weight) = thesis.basketAsset(0);
        assertEq(feed, address(assetA));
        assertEq(weight, 6_000);
        assertEq(uint8(thesis.state()), uint8(ThesisChallenge.State.OPEN));
    }

    function test_FeedAllowlistAndCanonicalCollateral() public {
        assertTrue(factory.allowedFeed(address(assetA)));
        assertTrue(factory.allowedFeed(address(refFeed)));
        assertEq(address(factory.canonicalCollateral()), address(usdg));

        ThesisChallenge.BasketAsset[] memory basket = new ThesisChallenge.BasketAsset[](1);
        basket[0] = ThesisChallenge.BasketAsset(address(outsider), 10_000);
        vm.prank(creator);
        usdg.approve(address(factory), type(uint256).max);
        vm.expectRevert();
        factory.createThesis("unsupported feed", basket, address(refFeed), BOND);
    }

    function test_ChallengeAggregatesAndCapsAtOpenBounty() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, 300e18, "Unlock pressure is underestimated.");
        approveAndChallenge(thesis, faderA, 200e18, "The second read is still weak.");
        approveAndChallenge(thesis, faderB, 500e18, "Funding is already crowded.");

        assertEq(thesis.challengerStake(faderA), 500e18);
        assertEq(thesis.challengerStake(faderB), 500e18);
        assertEq(thesis.challengePool(), BOND);
        assertEq(thesis.openBounty(), 0);
        assertEq(thesis.matchedConviction(), BOND);

        vm.expectRevert(ThesisChallenge.ChallengeAmountTooLarge.selector);
        vm.prank(outsider);
        thesis.challenge(1, "No bounty remains.");
    }

    function test_ChallengeRejectsSelfEmptyNoteAndOversizedNote() public {
        ThesisChallenge thesis = createDefaultThesis();

        vm.expectRevert(ThesisChallenge.CreatorCannotChallenge.selector);
        vm.prank(creator);
        thesis.challenge(1e18, "self fade");

        vm.expectRevert(ThesisChallenge.InvalidNote.selector);
        vm.prank(faderA);
        thesis.challenge(1e18, "");

        bytes memory oversized = new bytes(281);
        vm.expectRevert(ThesisChallenge.InvalidNote.selector);
        vm.prank(faderA);
        thesis.challenge(1e18, string(oversized));
    }

    function test_RaiseConvictionOnlyCreatorDuringOpenWindow() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndRaise(thesis, 500e18, "Still backing it.");
        assertEq(thesis.creatorBond(), 1_500e18);
        assertEq(thesis.openBounty(), 1_500e18);

        vm.warp(thesis.challengeEndsAt() + 1);
        assertEq(uint8(thesis.state()), uint8(ThesisChallenge.State.LOCKED));
        vm.expectRevert(ThesisChallenge.ChallengeWindowClosed.selector);
        vm.prank(creator);
        thesis.raiseConviction(1e18, "too late");

        vm.expectRevert(ThesisChallenge.ChallengeWindowClosed.selector);
        vm.prank(faderA);
        thesis.challenge(1e18, "too late");
    }

    function test_ChallengeAtExactOpenBountyIsAllowed() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, BOND, "Exact bounty boundary.");
        assertEq(thesis.challengePool(), BOND);
        assertEq(thesis.openBounty(), 0);
    }

    function test_ChallengeAtWindowEndIsClosed() public {
        ThesisChallenge thesis = createDefaultThesis();
        vm.warp(thesis.challengeEndsAt());
        vm.expectRevert(ThesisChallenge.ChallengeWindowClosed.selector);
        vm.prank(faderA);
        thesis.challenge(1e18, "Window is closed.");
    }

    function test_SettlePositiveAlphaAndProRataClaims() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, 300e18, "Unlock pressure.");
        approveAndChallenge(thesis, faderB, 200e18, "Crowded funding.");

        advanceToExpiry(thesis);
        publishPrices(210e8, 105e8, 500e8); // basket +5%, reference 0%
        thesis.settle();

        assertEq(uint8(thesis.state()), uint8(ThesisChallenge.State.SETTLED));
        assertEq(thesis.realizedAlphaBps(), 500);
        assertEq(thesis.creatorPayout(), 1_250e18);
        assertEq(thesis.challengePayoutPool(), 250e18);
        assertEq(thesis.challengerPayout(faderA), 150e18);
        assertEq(thesis.challengerPayout(faderB), 100e18);

        vm.prank(creator);
        thesis.claim();
        vm.prank(faderA);
        thesis.claim();
        vm.prank(faderB);
        thesis.claim();
        assertEq(usdg.balanceOf(address(thesis)), 0);
        assertEq(thesis.totalClaimed(), 1_500e18);
    }

    function test_SettleNegativeAlphaMovesTransferToChallengers() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, 500e18, "The reference will lead.");

        advanceToExpiry(thesis);
        publishPrices(200e8, 100e8, 525e8); // basket 0%, reference +5%
        thesis.settle();

        assertEq(thesis.realizedAlphaBps(), -500);
        assertEq(thesis.creatorPayout(), 750e18);
        assertEq(thesis.challengePayoutPool(), 750e18);
        assertEq(thesis.challengerPayout(faderA), 750e18);
    }

    function test_AlphaIsUncappedButTransferIsBounded() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, 500e18, "Fade the call.");

        advanceToExpiry(thesis);
        publishPrices(240e8, 120e8, 500e8); // basket +20%, reference 0%
        thesis.settle();

        assertEq(thesis.realizedAlphaBps(), 2_000);
        assertEq(thesis.creatorPayout(), 1_500e18);
        assertEq(thesis.challengePayoutPool(), 0);
    }

    function test_WeightedAlphaPreservesSubBpsContributions() public {
        ThesisChallenge thesis = createDefaultThesis();

        advanceToExpiry(thesis);
        publishPrices(20_002_000_000, 10_001_000_000, 500e8); // each asset +1 bps, reference flat
        thesis.settle();

        assertEq(thesis.realizedAlphaBps(), 1);
    }

    function test_ZeroAlphaReturnsPrincipal() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, 500e18, "No relative edge.");

        advanceToExpiry(thesis);
        publishPrices(200e8, 100e8, 500e8);
        thesis.settle();

        assertEq(thesis.realizedAlphaBps(), 0);
        assertEq(thesis.creatorPayout(), BOND);
        assertEq(thesis.challengePayoutPool(), 500e18);
    }

    function test_NoChallengersStillSettlesWithoutPnl() public {
        ThesisChallenge thesis = createDefaultThesis();
        advanceToExpiry(thesis);
        publishPrices(240e8, 120e8, 500e8);
        thesis.settle();

        assertEq(thesis.realizedAlphaBps(), 2_000);
        assertEq(thesis.matchedConviction(), 0);
        assertEq(thesis.creatorPayout(), BOND);
        vm.prank(creator);
        thesis.claim();
        assertEq(usdg.balanceOf(address(thesis)), 0);
    }

    function test_PreExpiryAndUnsafeObservationsRejectSettlement() public {
        ThesisChallenge thesis = createDefaultThesis();
        vm.expectRevert(ThesisChallenge.TooEarly.selector);
        thesis.settle();

        advanceToExpiry(thesis);
        assetA.updateAnswer(210e8);
        vm.expectRevert(ThesisChallenge.UnsafeSettlement.selector);
        thesis.settle();
    }

    function test_ExpiredUnsafeWindowCancelsAndRefunds() public {
        ThesisChallenge thesis = createDefaultThesis();
        approveAndChallenge(thesis, faderA, 500e18, "Refund if the oracle is unsafe.");

        vm.warp(uint256(thesis.resolvesAt()) + thesis.settlementWindow() + 1);
        thesis.settle();
        assertEq(uint8(thesis.state()), uint8(ThesisChallenge.State.CANCELLED));
        assertEq(thesis.realizedAlphaBps(), 0);
        assertEq(thesis.creatorPayout(), BOND);
        assertEq(thesis.challengePayoutPool(), 500e18);
        assertEq(thesis.challengerPayout(faderA), 500e18);

        vm.prank(creator);
        thesis.claim();
        vm.prank(faderA);
        thesis.claim();
        assertEq(usdg.balanceOf(address(thesis)), 0);
    }

    function test_DoubleClaimAndUnknownClaimReject() public {
        ThesisChallenge thesis = createDefaultThesis();
        advanceToExpiry(thesis);
        publishPrices(200e8, 100e8, 500e8);
        thesis.settle();

        vm.prank(creator);
        thesis.claim();
        vm.expectRevert(ThesisChallenge.AlreadyClaimed.selector);
        vm.prank(creator);
        thesis.claim();

        vm.expectRevert(ThesisChallenge.NothingToClaim.selector);
        vm.prank(outsider);
        thesis.claim();
    }

    function test_FactoryRejectsNonCanonicalAndUnapprovedConfiguration() public {
        ThesisChallenge.BasketAsset[] memory basket = new ThesisChallenge.BasketAsset[](1);
        basket[0] = ThesisChallenge.BasketAsset(address(assetA), 10_000);
        vm.startPrank(creator);
        usdg.approve(address(factory), type(uint256).max);
        vm.expectRevert();
        factory.createThesis("wrong reference", basket, address(outsider), BOND);
        vm.stopPrank();
    }
}
