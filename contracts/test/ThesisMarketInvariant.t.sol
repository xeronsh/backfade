// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./BaseTest.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {ThesisMarket} from "../src/legacy/ThesisMarket.sol";

/// @notice Handler that only performs legal user actions, so the invariants below are
///         checked over realistic state transitions instead of random calldata.
contract MarketHandler is BaseTest {
    uint256 public ghostBack;
    uint256 public ghostFade;
    address public marketAddress;

    function setUp() public override {
        super.setUp();
        marketAddress = address(createDefaultMarket());
        setMarket(ThesisMarket(marketAddress));
    }

    function join(uint256 amount) external {
        amount = bound(amount, 1e18, 500e18);
        if (block.timestamp >= market().bettingEndsAt()) return;

        deal(address(usdg), backer, amount);
        vm.startPrank(backer);
        usdg.approve(marketAddr(), amount);
        market().back(amount);
        vm.stopPrank();
        ghostBack += amount;

        deal(address(usdg), fader, amount);
        vm.startPrank(fader);
        usdg.approve(marketAddr(), amount);
        market().fade(amount);
        vm.stopPrank();
        ghostFade += amount;
    }

    function resolveMarket(uint256 price) external {
        if (market().outcome() != ThesisMarket.Outcome.Unresolved) return;
        vm.warp(market().resolvesAt() + 1);
        price = bound(price, 1e8, 2_000e8);
        cegFeed.updateAnswer(int256(price));
        vstFeed.updateAnswer(int256(price));
        gevFeed.updateAnswer(int256(price));
        nvdaFeed.updateAnswer(int256(price));
        market().resolve();
    }

    function cancelMarket() external {
        if (market().outcome() != ThesisMarket.Outcome.Unresolved) return;
        vm.warp(market().resolvesAt() + market().settlementWindow() + 1);
        market().cancelAfterDeadline();
    }

    function claimFor(uint256 who) external {
        ThesisMarket.Outcome o = market().outcome();
        if (o == ThesisMarket.Outcome.Unresolved) return;
        address[3] memory users = [creator, backer, fader];
        address u = users[who % 3];
        if (o == ThesisMarket.Outcome.Cancelled) {
            if (market().backStake(u) + market().fadeStake(u) == 0) return;
            vm.prank(u);
            market().refund();
        } else {
            uint256 stake = o == ThesisMarket.Outcome.Back ? market().backStake(u) : market().fadeStake(u);
            if (stake == 0) return;
            vm.prank(u);
            market().claim();
        }
    }

    function market() internal view returns (ThesisMarket) {
        return ThesisMarket(marketAddr_);
    }

    /// @dev The handler owns its own MockUSDG instance; expose it so the invariant
    ///      assertions read the same ledger.
    function collateralBalance() external view returns (uint256) {
        return usdg.balanceOf(marketAddr_);
    }
}

contract PoolConservationInvariantTest is StdInvariant, BaseTest {
    MarketHandler handler;

    function setUp() public override {
        super.setUp();
        handler = new MarketHandler();
        handler.setUp();
        setMarket(ThesisMarket(handler.marketAddress()));

        FuzzSelector memory sel = FuzzSelector({addr: address(handler), selectors: _selectors()});
        targetSelector(sel);
        targetContract(address(handler));
        excludeContract(address(usdg));
        excludeContract(address(factory));
    }

    function _selectors() private pure returns (bytes4[] memory s) {
        s = new bytes4[](4);
        s[0] = MarketHandler.join.selector;
        s[1] = MarketHandler.resolveMarket.selector;
        s[2] = MarketHandler.cancelMarket.selector;
        s[3] = MarketHandler.claimFor.selector;
    }

    /// Before settlement the market holds exactly the sum of both pools; after settlement
    /// it holds at most that sum (floor dust only, never more).
    function invariant_CollateralNeverExceedsPools() public view {
        uint256 pools = market().backPool() + market().fadePool();
        uint256 balance = handler.collateralBalance();
        if (market().outcome() == ThesisMarket.Outcome.Unresolved) {
            assertEq(balance, pools, "collateral != backPool + fadePool");
        } else {
            assertLe(balance, pools, "collateral exceeds pools");
        }
    }

    /// Tracked deposits always add up to the pools — no silent accounting drift.
    function invariant_StakesMatchPools() public view {
        assertEq(
            market().backPool() + market().fadePool(),
            BOND + handler.ghostBack() + handler.ghostFade(),
            "stakes != pools"
        );
    }

    /// Payout can never mint collateral out of thin air.
    function invariant_TotalClaimedNeverExceedsPool() public view {
        assertLe(
            market().totalClaimed(), market().backPool() + market().fadePool(), "claimed more than was ever deposited"
        );
    }

    /// The market can never hold more than was deposited, whatever the call order.
    function invariant_MarketNeverOverdrawn() public view {
        assertLe(handler.collateralBalance(), market().backPool() + market().fadePool());
    }

    /// The creator bond is always an ordinary BACK stake, or already claimed exactly once.
    function invariant_CreatorBondIsBackStake() public view {
        uint256 stake = market().backStake(creator);
        assertTrue(stake == market().creatorBond() || stake == 0, "bond accounting broken");
    }

    /// A settled market must never strand collateral: either the winning pool is non-empty and
    /// winners can be paid, or the market settled as a refund. This guards the empty-winning-pool
    /// case, where pro-rata payout would divide by zero and lock every stake forever.
    function invariant_SettledMarketIsAlwaysPayable() public view {
        ThesisMarket.Outcome o = market().outcome();
        if (o == ThesisMarket.Outcome.Back) {
            assertGt(market().backPool(), 0, "BACK settled with an empty winning pool");
        } else if (o == ThesisMarket.Outcome.Fade) {
            assertGt(market().fadePool(), 0, "FADE settled with an empty winning pool");
        }
    }

    /// Once every winner has claimed out a resolved market, nothing material is left.
    function invariant_FullyClaimedMarketIsEmpty() public view {
        ThesisMarket.Outcome o = market().outcome();
        if (o != ThesisMarket.Outcome.Back && o != ThesisMarket.Outcome.Fade) return;
        bool allClaimed =
            market().backStake(creator) == 0 && market().backStake(backer) == 0 && market().fadeStake(fader) == 0;
        if (!allClaimed) return;
        // two possible winners at most in this handler -> at most 1 wei of dust each
        assertLe(handler.collateralBalance(), 2, "material collateral left after full claim-out");
    }

    function market() internal view returns (ThesisMarket) {
        return ThesisMarket(marketAddr_);
    }

    /// @dev The handler owns its own MockUSDG instance; expose it so the invariant
    ///      assertions read the same ledger.
    function collateralBalance() external view returns (uint256) {
        return usdg.balanceOf(marketAddr_);
    }
}
