// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./BaseTest.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {MockV3Aggregator} from "./MockV3Aggregator.sol";

contract ThesisMarketFuzzTest is BaseTest {
    function setUp() public override {
        super.setUp();
        setMarket(createDefaultMarket());
    }

    /// Outcome must match the pure math for arbitrary positive prices.
    function testFuzz_OutcomeMatchesMath(uint256 cegEnd, uint256 vstEnd, uint256 gevEnd, uint256 nvdaEnd) public {
        cegEnd = bound(cegEnd, 1e8, 10_000e8);
        vstEnd = bound(vstEnd, 1e8, 10_000e8);
        gevEnd = bound(gevEnd, 1e8, 10_000e8);
        nvdaEnd = bound(nvdaEnd, 1e8, 10_000e8);

        vm.warp(block.timestamp + RESOLVES_AT + 1);
        cegFeed.updateAnswer(int256(uint256(cegEnd)));
        vstFeed.updateAnswer(int256(uint256(vstEnd)));
        gevFeed.updateAnswer(int256(uint256(gevEnd)));
        nvdaFeed.updateAnswer(int256(uint256(nvdaEnd)));

        market().resolve();

        int256 cegRet = _retBps(200e8, int256(uint256(cegEnd)));
        int256 vstRet = _retBps(100e8, int256(uint256(vstEnd)));
        int256 gevRet = _retBps(300e8, int256(uint256(gevEnd)));
        int256 benchRet = _retBps(500e8, int256(uint256(nvdaEnd)));
        int256 basket = (cegRet * 4000 + vstRet * 3500 + gevRet * 2500) / 10_000;
        int256 alpha = basket - benchRet;

        assertEq(market().narrativeAlphaBps(), alpha, "alpha mismatch");
        if (alpha >= market().hurdleBps()) {
            assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
        } else {
            assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Fade));
        }
    }

    /// Pools are conserved: backPool + fadePool == total collateral held.
    function testFuzz_PoolConservation(uint256 backAmt, uint256 fadeAmt) public {
        backAmt = bound(backAmt, 1e18, 5_000e18);
        fadeAmt = bound(fadeAmt, 1e18, 5_000e18);
        backFrom(backer, backAmt);
        fadeFrom(fader, fadeAmt);
        assertEq(market().backPool() + market().fadePool(), usdg.balanceOf(marketAddr()));
    }

    /// Random stakes, random winner split, random claim order: payout is conserved.
    /// Winning side drains to zero; only sub-wei-per-winner floor dust may remain.
    function testFuzz_BackWinnersPayoutConservation(uint256 a, uint256 b, uint256 fadeAmt, uint8 order) public {
        a = bound(a, 1e18, 2_000e18);
        b = bound(b, 1e18, 2_000e18);
        fadeAmt = bound(fadeAmt, 1e18, 3_000e18);

        backFrom(backer, a);
        backFrom(third, b);
        fadeFrom(fader, fadeAmt);
        uint256 totalPool = market().backPool() + market().fadePool();

        warpAndPrintBackWins();
        market().resolve();

        address[3] memory winners = [creator, backer, third];
        (uint256 i, uint256 j, uint256 k) = _permute(order);
        vm.prank(winners[i]);
        market().claim();
        vm.prank(winners[j]);
        market().claim();
        vm.prank(winners[k]);
        market().claim();

        assertLe(usdg.balanceOf(marketAddr()), 2, "floor dust exceeds winner count");
        assertLe(market().totalClaimed(), totalPool, "claimed more than the pool");
        assertGe(market().totalClaimed(), totalPool - 2, "pool not distributed");
    }

    /// A single winning position always takes the entire pool, whatever the amounts.
    function testFuzz_SingleWinnerTakesWholePool(uint256 backAmt, uint256 fadeAmt) public {
        backAmt = bound(backAmt, 1e18, 5_000e18);
        fadeAmt = bound(fadeAmt, 1e18, 5_000e18);
        backFrom(backer, backAmt);
        fadeFrom(fader, fadeAmt);

        warpAndPrintFadeWins(); // fader is the only FADE position
        market().resolve();
        assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Fade));

        uint256 totalPool = market().backPool() + market().fadePool();
        uint256 before = usdg.balanceOf(fader);
        vm.prank(fader);
        market().claim();
        assertEq(usdg.balanceOf(fader), before + totalPool, "single winner must take all");
        assertEq(usdg.balanceOf(marketAddr()), 0, "market must be empty");
    }

    /// No position can ever be paid more than the pool, on either side.
    function testFuzz_PayoutNeverExceedsPool(uint256 backAmt, uint256 fadeAmt) public {
        backAmt = bound(backAmt, 1e18, 5_000e18);
        fadeAmt = bound(fadeAmt, 1e18, 5_000e18);
        backFrom(backer, backAmt);
        fadeFrom(fader, fadeAmt);
        uint256 totalPool = market().backPool() + market().fadePool();

        warpAndPrintBackWins();
        market().resolve();

        assertLe(market().winnerPayout(ThesisMarket.Outcome.Back, market().backStake(backer)), totalPool);
        assertLe(market().winnerPayout(ThesisMarket.Outcome.Fade, market().fadeStake(fader)), totalPool);

        vm.prank(backer);
        market().claim();
        vm.prank(creator);
        market().claim();
        assertLe(usdg.balanceOf(marketAddr()), 2, "over-drained / leftover above floor dust");
        assertLe(market().totalClaimed(), totalPool, "over-minted");
    }

    /// Arbitrary valid baskets (1..5 assets, weights summing to 10000) and arbitrary
    /// positive prices must reproduce the same alpha the contract computes.
    function testFuzz_BasketWeightsAndPrices(
        uint256 w0,
        uint256 w1,
        uint256 p0,
        uint256 p1,
        uint256 p2,
        uint256 benchPrice
    ) public {
        _fuzzBasket(w0, w1, p0, p1, p2, benchPrice);
    }

    function _fuzzBasket(uint256 w0, uint256 w1, uint256 p0, uint256 p1, uint256 p2, uint256 benchPrice) private {
        uint256[3] memory starts;
        starts[0] = bound(p0, 1e8, 9_000e8);
        starts[1] = bound(p1, 1e8, 9_000e8);
        starts[2] = bound(p2, 1e8, 9_000e8);
        uint256 benchStart = bound(benchPrice, 1e8, 9_000e8);

        MockV3Aggregator f0 = new MockV3Aggregator(8, int256(starts[0]));
        MockV3Aggregator f1 = new MockV3Aggregator(8, int256(starts[1]));
        MockV3Aggregator f2 = new MockV3Aggregator(8, int256(starts[2]));
        MockV3Aggregator bench = new MockV3Aggregator(8, int256(benchStart));

        uint256[3] memory w;
        w[0] = bound(w0, 1, 9_998);
        w[1] = bound(w1, 1, 9_999 - w[0]);
        w[2] = 10_000 - w[0] - w[1]; // guarantees an exact 10000 sum

        ThesisMarket.MarketParams memory p = defaultParams();
        delete p.basket;
        p.basket = new ThesisMarket.BasketAsset[](3);
        p.basket[0] = ThesisMarket.BasketAsset(address(f0), uint16(w[0]));
        p.basket[1] = ThesisMarket.BasketAsset(address(f1), uint16(w[1]));
        p.basket[2] = ThesisMarket.BasketAsset(address(f2), uint16(w[2]));
        p.benchmarkFeed = address(bench);
        setMarket(deployMarket(p, BOND));

        vm.warp(block.timestamp + RESOLVES_AT + 1);
        uint256[3] memory ends;
        ends[0] = _randomPrice("e0");
        ends[1] = _randomPrice("e1");
        ends[2] = _randomPrice("e2");
        uint256 benchEnd = _randomPrice("eb");
        f0.updateAnswer(int256(ends[0]));
        f1.updateAnswer(int256(ends[1]));
        f2.updateAnswer(int256(ends[2]));
        bench.updateAnswer(int256(benchEnd));
        market().resolve();

        int256 expected = _expectedAlpha(starts, ends, w, benchStart, benchEnd);
        assertEq(market().narrativeAlphaBps(), expected, "weighted alpha mismatch");
    }

    function _randomPrice(string memory tag) private pure returns (uint256) {
        return bound(uint256(keccak256(bytes(tag))), 1e8, 9_000e8);
    }

    function _expectedAlpha(
        uint256[3] memory starts,
        uint256[3] memory ends,
        uint256[3] memory w,
        uint256 benchStart,
        uint256 benchEnd
    ) private pure returns (int256) {
        int256 acc;
        for (uint256 i = 0; i < 3; i++) {
            acc += _retBps(starts[i], int256(ends[i])) * int256(w[i]);
        }
        return acc / 10_000 - _retBps(benchStart, int256(benchEnd));
    }

    /// The settlement window boundary is enforced for random observation times.
    function testFuzz_EndPriceMustLandInsideWindow(uint256 offset) public {
        offset = bound(offset, 0, 12 hours);
        uint64 resolvesAt = uint64(block.timestamp + RESOLVES_AT);
        vm.warp(uint256(resolvesAt) + offset);

        cegFeed.updateAnswer(250e8);
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);

        uint64 window = market().settlementWindow();
        if (offset <= window) {
            market().resolve();
            assertEq(uint8(market().outcome()), uint8(ThesisMarket.Outcome.Back));
        } else {
            vm.expectRevert(ThesisMarket.SettlementWindowPassed.selector);
            market().resolve();
        }
    }

    function _permute(uint8 order) private pure returns (uint256, uint256, uint256) {
        uint8 o = order % 6;
        if (o == 0) return (0, 1, 2);
        if (o == 1) return (0, 2, 1);
        if (o == 2) return (1, 0, 2);
        if (o == 3) return (1, 2, 0);
        if (o == 4) return (2, 0, 1);
        return (2, 1, 0);
    }

    function _retBps(uint256 startPrice, int256 endPrice) internal pure returns (int256) {
        return (((int256(endPrice) * 1e18 / int256(startPrice)) - 1e18) * 10_000) / 1e18;
    }

    function market() internal view returns (ThesisMarket) {
        return ThesisMarket(marketAddr());
    }
}
