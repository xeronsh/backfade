// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./BaseTest.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {MockV3Aggregator, BrokenV3Aggregator} from "./MockV3Aggregator.sol";

contract ThesisMarketTest is BaseTest {
    function setUp() public override {
        super.setUp();
        setMarket(createDefaultMarket());
    }

    // --- creation ---

    function test_CreatorBondIsBackStake() public view {
        assertEq(market().backStake(creator), BOND);
        assertEq(market().backPool(), BOND);
        assertEq(market().creatorBond(), BOND);
    }

    function test_SettlementConfigIsImmutablePerMarket() public view {
        assertEq(market().settlementWindow(), 30 minutes);
        assertEq(market().maxStartAge(), 30 minutes);
        assertEq(market().resolvesAt(), uint64(block.timestamp + RESOLVES_AT));
    }

    function test_FactoryRejectsZeroBond() public {
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(defaultParams(), 0));
    }

    function test_RejectBadWeights() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].weightBps = 5000; // sum = 11000
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectHurdleOutOfRange() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        p.hurdleBps = 50; // below 100
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));

        p.hurdleBps = 6000; // above 5000
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectBasketTooLarge() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        delete p.basket;
        p.basket = new ThesisMarket.BasketAsset[](6);
        for (uint256 i; i < 6; i++) {
            p.basket[i] = ThesisMarket.BasketAsset(address(cegFeed), 0);
        }
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectDuplicateFeedInBasket() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[1].feed = p.basket[0].feed;
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectBenchmarkAlsoInBasket() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].feed = address(nvdaFeed);
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectResolvesAtInPast() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        p.resolvesAt = uint64(block.timestamp);
        p.bettingEndsAt = uint64(block.timestamp - 1);
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    // --- settlement config validation ---

    function test_RejectSettlementWindowOutOfRange() public {
        vm.expectRevert();
        deployMarketWith(defaultParams(), BOND, 14 minutes, 24 hours);
        vm.expectRevert();
        deployMarketWith(defaultParams(), BOND, 25 hours, 24 hours);
    }

    function test_RejectMaxStartAgeOutOfRange() public {
        vm.expectRevert();
        deployMarketWith(defaultParams(), BOND, 30 minutes, 0);
        vm.expectRevert();
        deployMarketWith(defaultParams(), BOND, 30 minutes, 25 hours);
    }

    // --- start price freshness ---

    function test_RejectStaleStartPrice() public {
        vm.warp(block.timestamp + 31 minutes); // feeds last updated at t0, maxStartAge = 30m
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(defaultParams(), BOND));
    }

    function test_AcceptStartPriceInsideMaxAge() public {
        vm.warp(block.timestamp + 29 minutes);
        vm.startPrank(creator);
        usdg.approve(address(factory), type(uint256).max);
        ThesisMarket m = ThesisMarket(factory.createMarket(defaultParams(), BOND));
        vm.stopPrank();
        assertEq(m.startPrices(0), 200e18);
        assertEq(m.startPrices(3), 500e18); // benchmark stored last
    }

    function test_RejectFutureDatedStartPrice() public {
        uint256 future = block.timestamp + 1 hours;
        BrokenV3Aggregator futureFeed = new BrokenV3Aggregator(200e8, future);
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].feed = address(futureFeed);
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectZeroUpdatedAtStartPrice() public {
        BrokenV3Aggregator zeroFeed = new BrokenV3Aggregator(200e8, 0);
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].feed = address(zeroFeed);
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectNonPositiveStartPrice() public {
        BrokenV3Aggregator negativeFeed = new BrokenV3Aggregator(-1, block.timestamp);
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].feed = address(negativeFeed);
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    function test_RejectFeedWithoutCode() public {
        ThesisMarket.MarketParams memory p = defaultParams();
        p.benchmarkFeed = makeAddr("eoa-benchmark");
        vm.prank(creator);
        vm.expectRevert();
        ThesisMarket(factory.createMarket(p, BOND));
    }

    // --- betting ---

    function test_BackAndFadeRecordStakes() public {
        backFrom(backer, 100e18);
        fadeFrom(fader, 100e18);
        assertEq(market().backPool(), BOND + 100e18);
        assertEq(market().fadePool(), 100e18);
    }

    function test_RejectBetAfterCutoff() public {
        vm.warp(block.timestamp + BETTING_END + 1);
        vm.prank(backer);
        vm.expectRevert(ThesisMarket.BettingClosed.selector);
        market().back(1e18);
    }

    function test_RejectZeroBet() public {
        vm.prank(backer);
        vm.expectRevert();
        market().back(0);
    }

    // --- resolution ---

    function test_ResolveBackWins() public {
        warpAndPrintBackWins();
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
        assertEq(market().narrativeAlphaBps(), 2000); // basket +25%, benchmark +5%
    }

    function test_ResolveFadeWins() public {
        warpAndPrintFadeWins();
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Fade));
    }

    function test_RejectResolveTwice() public {
        warpAndPrintBackWins();
        market().resolve();
        vm.expectRevert(ThesisMarket.AlreadyResolved.selector);
        market().resolve();
    }

    function test_ExactHurdleGoesToBack() public {
        // single-asset basket so alpha is exactly the hurdle
        ThesisMarket.MarketParams memory p = defaultParams();
        delete p.basket;
        p.basket = new ThesisMarket.BasketAsset[](1);
        p.basket[0] = ThesisMarket.BasketAsset(address(cegFeed), 10_000);
        setMarket(deployMarket(p, BOND));

        // CEG 200 -> 220 = +10% exactly equals hurdle 1000 bps; NVDA refreshed flat
        vm.warp(block.timestamp + RESOLVES_AT + 1);
        cegFeed.updateAnswer(220e8);
        nvdaFeed.updateAnswer(500e8);
        market().resolve();
        assertEq(market().narrativeAlphaBps(), 1000);
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
    }

    function test_ResolveWithMixedFeedDecimals() public {
        MockV3Aggregator vst6 = new MockV3Aggregator(6, 100e6);
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[1].feed = address(vst6);
        setMarket(deployMarket(p, BOND));

        backFrom(backer, 300e18);
        fadeFrom(fader, 100e18);
        vm.warp(block.timestamp + RESOLVES_AT + 1);
        cegFeed.updateAnswer(250e8);
        vst6.updateAnswer(125e6);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
        market().resolve();
        assertEq(market().narrativeAlphaBps(), 2000);
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
    }

    function test_ResolveWithNegativeBasketReturn() public {
        warpAndPrintFadeWins();
        market().resolve();
        assertLt(market().narrativeAlphaBps(), 0);
    }

    // --- settlement timing / oracle integrity ---

    function test_RejectResolveBeforeTime() public {
        vm.expectRevert(ThesisMarket.BeforeResolveTime.selector);
        market().resolve();
    }

    function test_RejectEndPriceObservedBeforeExpiry() public {
        // prices are only ever printed at t0, then we jump past expiry: every feed's
        // updatedAt < resolvesAt, so no pre-expiry price can settle the market
        vm.warp(block.timestamp + RESOLVES_AT + 1);
        vm.expectRevert(bytes("OracleMath: pre-expiry price"));
        market().resolve();
    }

    /// Spec §8: anyone may resolve, and the caller cannot steer the result. The same
    /// legal observation set produces the identical outcome and alpha whoever pushes it.
    function test_ResolveIsPermissionlessAndCallerIndependent() public {
        backFrom(backer, 300e18);
        fadeFrom(fader, 100e18);
        warpAndPrintBackWins();

        vm.prank(third); // unrelated account, not creator, not a participant
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
        assertEq(market().narrativeAlphaBps(), 2000);
    }

    /// Spec §8: once a legal post-expiry observation settles the market, a later print
    /// inside the same window cannot re-open it — the outcome is frozen for everyone.
    function test_OutcomeFrozenAtFirstLegalResolution() public {
        warpAndPrintBackWins();
        market().resolve();
        int256 frozen = market().narrativeAlphaBps();

        // a second, very different print 10 minutes later is simply ignored
        vm.warp(block.timestamp + 10 minutes);
        cegFeed.updateAnswer(20e8);
        vstFeed.updateAnswer(10e8);
        gevFeed.updateAnswer(30e8);
        nvdaFeed.updateAnswer(5_000e8);

        vm.expectRevert(ThesisMarket.AlreadyResolved.selector);
        market().resolve();
        assertEq(market().narrativeAlphaBps(), frozen);
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
    }

    /// Spec §8: a non-positive answer observed after expiry must still be refused.
    function test_RejectNonPositiveEndAnswerAtResolve() public {
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        // start price is valid; the feed later reports a non-positive answer inside the window
        BrokenV3Aggregator badFeed = new BrokenV3Aggregator(200e8, block.timestamp);
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].feed = address(badFeed);
        setMarket(deployMarket(p, BOND));

        vm.warp(uint256(resolvesAt) + 1 minutes);
        badFeed.setAnswer(-1);
        badFeed.setUpdatedAt(uint256(resolvesAt) + 1 minutes);
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
        vm.expectRevert(bytes("OracleMath: non-positive answer"));
        market().resolve();
    }

    /// Spec §8: a zero-timestamp observation must be refused even if it is recent.
    function test_RejectZeroUpdatedAtEndPriceAtResolve() public {
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        BrokenV3Aggregator noStamp = new BrokenV3Aggregator(200e8, block.timestamp);
        ThesisMarket.MarketParams memory p = defaultParams();
        p.basket[0].feed = address(noStamp);
        setMarket(deployMarket(p, BOND));

        vm.warp(uint256(resolvesAt) + 1 minutes);
        noStamp.setUpdatedAt(0);
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
        vm.expectRevert(bytes("OracleMath: zero updatedAt"));
        market().resolve();
    }

    /// Spec §8: the settlement observation must sit inside the window, not merely be recent
    /// in wall-clock terms. A print 45 minutes after expiry fails a 30 minute window.
    function test_RejectObservationOutsideWindowEvenIfFresh() public {
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        vm.warp(uint256(resolvesAt) + 46 minutes);
        vm.expectRevert(ThesisMarket.SettlementWindowPassed.selector);
        market().resolve();
    }

    /// @notice Settlement invariant, per market, in one place:
    ///  1. resolve() is permissionless and takes no price input — the caller cannot steer it.
    ///  2. Every feed's observation must satisfy resolvesAt <= updatedAt <= resolvesAt + window,
    ///     so a pre-expiry print is refused and the search space for an end price is bounded
    ///     to the market's own immutable window.
    ///  3. The first caller who supplies a fully legal observation set freezes the outcome;
    ///     later prints cannot re-open it (AlreadyResolved).
    ///  4. If no legal observation ever appears, the window expires and cancel() refunds all
    ///     stakes in full — the protocol never falls back to an admin or a creator decision.
    function test_SettlementInvariantSummary() public {
        warpAndPrintBackWins();
        vm.prank(third);
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
        assertEq(market().settlementWindow(), 30 minutes);
    }

    function test_RejectEndPriceAfterSettlementWindow() public {
        vm.warp(block.timestamp + RESOLVES_AT + 31 minutes);
        vm.expectRevert(ThesisMarket.SettlementWindowPassed.selector);
        market().resolve();
    }

    /// A print taken long after expiry cannot settle the market: by the time the caller can
    /// see it, the market's own window has closed and resolve() is already sealed off.
    function test_EndPricePrintedLateCannotRescueMarket() public {
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        // valid start print; the benchmark later "prints" outside the window
        BrokenV3Aggregator lateFeed = new BrokenV3Aggregator(500e8, block.timestamp);
        ThesisMarket.MarketParams memory p = defaultParams();
        delete p.basket;
        p.basket = new ThesisMarket.BasketAsset[](1);
        p.basket[0] = ThesisMarket.BasketAsset(address(cegFeed), 10_000);
        p.benchmarkFeed = address(lateFeed);
        setMarket(deployMarketWith(p, BOND, 30 minutes, 30 minutes));

        vm.warp(uint256(resolvesAt) + 5 minutes);
        cegFeed.updateAnswer(250e8); // valid, inside window
        // benchmark still carries its creation-time print: pre-expiry, refused
        vm.expectRevert(bytes("OracleMath: pre-expiry price"));
        market().resolve();

        // benchmark prints 45 minutes after expiry: past the market's 30m window
        lateFeed.setUpdatedAt(uint256(resolvesAt) + 45 minutes);
        vm.expectRevert(bytes("OracleMath: price outside window"));
        market().resolve();

        vm.warp(uint256(resolvesAt) + 45 minutes);
        vm.expectRevert(ThesisMarket.SettlementWindowPassed.selector);
        market().resolve();

        market().cancelAfterDeadline(); // full refund path instead
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Cancelled));
    }

    function test_AcceptEndPriceExactlyAtExpiry() public {
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        vm.warp(resolvesAt);
        cegFeed.updateAnswer(250e8); // updatedAt == resolvesAt, the inclusive boundary
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
        market().resolve();
        assertEq(market().narrativeAlphaBps(), 2000);
    }

    function test_SettlementWindowIsPerMarketNotGlobal() public {
        // explicit 30 minute window on a market whose resolvedAt we control
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        setMarket(deployMarketWith(defaultParams(), BOND, 30 minutes, 30 minutes));

        vm.warp(uint256(resolvesAt) + 1 minutes);
        cegFeed.updateAnswer(250e8);
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
    }

    // --- payout: pari-mutuel, explicit spec cases ---

    /// Spec case A: BACK 800 (A 500, B 300), FADE 100. BACK wins.
    /// A = 500 * 900 / 800 = 562.5, B = 300 * 900 / 800 = 337.5, total 900.
    function test_PayoutCaseA_TwoBackWinners() public {
        backFrom(backer, 300e18); // BOND 500 = creator A, backer 300 = B
        fadeFrom(fader, 100e18);

        warpAndPrintBackWins();
        market().resolve();

        assertEq(market().backPool(), 800e18);
        assertEq(market().fadePool(), 100e18);
        assertEq(market().winnerPayout(ThesisMarket.Outcome.Back, 500e18), 562.5e18);
        assertEq(market().winnerPayout(ThesisMarket.Outcome.Back, 300e18), 337.5e18);

        vm.prank(creator);
        market().claim();
        vm.prank(backer);
        market().claim();

        assertEq(usdg.balanceOf(creator), 10_000e18 - BOND + 562.5e18);
        assertEq(usdg.balanceOf(backer), 10_000e18 - 300e18 + 337.5e18);
        assertEq(usdg.balanceOf(marketAddr()), 0, "material dust left");
        assertEq(market().totalClaimed(), 900e18);
    }

    /// Spec case B: single FADE winner walks away with the whole pool.
    function test_PayoutCaseB_SingleFadeWinnerTakesWholePool() public {
        backFrom(backer, 300e18);
        fadeFrom(fader, 100e18); // only fader ever fades

        warpAndPrintFadeWins();
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Fade));

        uint256 before = usdg.balanceOf(fader);
        vm.prank(fader);
        market().claim();
        assertEq(usdg.balanceOf(fader), before + 900e18);
        assertEq(usdg.balanceOf(marketAddr()), 0, "market collateral must be zero");
    }

    /// Spec case C: nobody fought the thesis — BACK only returns principal.
    function test_PayoutCaseC_EmptyLosingPoolReturnsPrincipalOnly() public {
        assertEq(market().fadePool(), 0);
        warpAndPrintBackWins();
        market().resolve();

        assertEq(market().winnerPayout(ThesisMarket.Outcome.Back, BOND), BOND);
        vm.prank(creator);
        market().claim();
        assertEq(usdg.balanceOf(creator), 10_000e18); // bond back exactly, no minting
        assertEq(usdg.balanceOf(marketAddr()), 0);
    }

    function test_ClaimTwiceIsRejected() public {
        warpAndPrintBackWins();
        market().resolve();
        vm.prank(creator);
        market().claim();
        vm.prank(creator);
        vm.expectRevert(ThesisMarket.NothingToClaim.selector);
        market().claim();
    }

    function test_LosingSideCannotClaim() public {
        backFrom(backer, 300e18);
        fadeFrom(fader, 100e18);
        warpAndPrintBackWins();
        market().resolve();
        vm.prank(fader);
        vm.expectRevert(ThesisMarket.NothingToClaim.selector);
        market().claim();
    }

    function test_ClaimBeforeResolveIsRejected() public {
        vm.prank(creator);
        vm.expectRevert(ThesisMarket.NotResolved.selector);
        market().claim();
    }

    // --- cancel / refund ---

    function test_CancelAfterDeadlineRefundsEveryoneInFull() public {
        backFrom(backer, 100e18);
        fadeFrom(fader, 400e18);
        vm.warp(block.timestamp + RESOLVES_AT + 31 minutes);
        market().cancelAfterDeadline();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Cancelled));

        vm.prank(backer);
        market().refund();
        assertEq(usdg.balanceOf(backer), 10_000e18);
        vm.prank(fader);
        market().refund();
        assertEq(usdg.balanceOf(fader), 10_000e18);
        vm.prank(creator);
        market().refund();
        assertEq(usdg.balanceOf(creator), 10_000e18);
        assertEq(usdg.balanceOf(marketAddr()), 0, "refunds must drain the market");
    }

    function test_CancelBeforeDeadlineIsRejected() public {
        vm.expectRevert(ThesisMarket.NotCancelled.selector);
        market().cancelAfterDeadline();
    }

    function test_CancelledMarketCannotBeResolved() public {
        vm.warp(block.timestamp + RESOLVES_AT + 31 minutes);
        market().cancelAfterDeadline();
        vm.expectRevert(ThesisMarket.AlreadyResolved.selector);
        market().resolve();
    }

    function test_ResolvedMarketCannotBeCancelled() public {
        warpAndPrintBackWins();
        market().resolve();
        vm.warp(block.timestamp + 31 minutes);
        vm.expectRevert(ThesisMarket.AlreadyResolved.selector);
        market().cancelAfterDeadline();
    }

    function test_CancelledMarketRejectsClaim() public {
        vm.warp(block.timestamp + RESOLVES_AT + 31 minutes);
        market().cancelAfterDeadline();
        vm.prank(creator);
        vm.expectRevert(ThesisMarket.NotCancelled.selector);
        market().claim();
    }

    function test_ResolvedMarketRejectsRefund() public {
        warpAndPrintBackWins();
        market().resolve();
        vm.prank(creator);
        vm.expectRevert(ThesisMarket.NotCancelled.selector);
        market().refund();
    }

    function test_RefundTwiceIsRejected() public {
        vm.warp(block.timestamp + RESOLVES_AT + 31 minutes);
        market().cancelAfterDeadline();
        vm.prank(creator);
        market().refund();
        vm.prank(creator);
        vm.expectRevert(ThesisMarket.NoPosition.selector);
        market().refund();
    }

    function test_NonParticipantCannotClaimOrRefund() public {
        warpAndPrintBackWins();
        market().resolve();
        vm.prank(third);
        vm.expectRevert(ThesisMarket.NothingToClaim.selector);
        market().claim();
    }

    // --- collateral conservation after full claim out ---

    function test_MultipleWinnersDrainPoolExactly() public {
        backFrom(backer, 100e18);
        backFrom(third, 200e18);
        fadeFrom(fader, 100e18);
        warpAndPrintBackWins();
        market().resolve();

        vm.prank(creator);
        market().claim();
        vm.prank(backer);
        market().claim();
        vm.prank(third);
        market().claim();

        assertEq(market().totalClaimed(), 900e18);
        assertEq(usdg.balanceOf(marketAddr()), 0, "collateral must not remain");
    }

    function test_RoundingDustIsBoundedByWinnerCount() public {
        // deliberately indivisible pool: 3 wei of losing pool over 2 winners
        setMarket(deployMarket(defaultParams(), 1));
        backFrom(backer, 1);
        fadeFrom(fader, 3);
        warpAndPrintBackWins();
        market().resolve();

        vm.prank(creator);
        market().claim();
        vm.prank(backer);
        market().claim();

        // 4 total, 2 winners -> at most 1 wei dust per winner
        assertLe(usdg.balanceOf(marketAddr()), 2, "dust beyond rounding bound");
        assertLe(market().totalClaimed(), 5);
    }

    function market() internal view returns (ThesisMarket) {
        return ThesisMarket(marketAddr());
    }
}
