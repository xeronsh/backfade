// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./BaseTest.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";

contract ThesisMarketFuzzTest is BaseTest {
    function setUp() public override {
        super.setUp();
        setMarket(createDefaultMarket());
    }

    /// Outcome must match the pure math for arbitrary positive prices.
    function testFuzz_OutcomeMatchesMath(
        uint256 cegEnd,
        uint256 vstEnd,
        uint256 gevEnd,
        uint256 nvdaEnd
    ) public {
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

        // recompute in the test
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

    /// Claimed payouts can never exceed the total pool.
    function testFuzz_ClaimNeverExceedsPool(uint256 backAmt, uint256 fadeAmt) public {
        backAmt = bound(backAmt, 1e18, 5_000e18);
        fadeAmt = bound(fadeAmt, 1e18, 5_000e18);
        backFrom(backer, backAmt);
        fadeFrom(fader, fadeAmt);

        vm.warp(block.timestamp + RESOLVES_AT + 1);
        cegFeed.updateAnswer(250e8);
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
        market().resolve();

        vm.prank(backer);
        market().claim();
        vm.prank(creator);
        market().claim();
        assertLe(usdg.balanceOf(marketAddr()), market().fadePool(), "contract over-drained");
    }

    function _retBps(uint256 startPrice, int256 endPrice) internal pure returns (int256) {
        return (((int256(endPrice) * 1e18 / int256(startPrice)) - 1e18) * 10_000) / 1e18;
    }

    function market() internal view returns (ThesisMarket) {
        return ThesisMarket(marketAddr());
    }
}
