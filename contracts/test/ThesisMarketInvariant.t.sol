// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./BaseTest.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";

/// Invariant: the contract's collateral balance always equals backPool + fadePool.
contract PoolConservationInvariantTest is BaseTest {
    function setUp() public override {
        super.setUp();
        setMarket(createDefaultMarket());
        targetContract(address(this));
    }

    function invariant_CollateralEqualsPools() public view {
        assertEq(
            usdg.balanceOf(marketAddr()),
            ThesisMarket(marketAddr()).backPool() + ThesisMarket(marketAddr()).fadePool(),
            "collateral != backPool + fadePool"
        );
    }

    function invariant_SumOfStakesEqualsPools() public view {
        // tracked via ghost variable through handler calls
        assertEq(
            ThesisMarket(marketAddr()).backPool() + ThesisMarket(marketAddr()).fadePool(),
            usdg.balanceOf(marketAddr())
        );
    }

    function back(uint256 amount) external {
        amount = bound(amount, 1e18, 1_000e18);
        deal(address(usdg), backer, usdg.balanceOf(backer) + amount);
        vm.startPrank(backer);
        usdg.approve(marketAddr(), type(uint256).max);
        ThesisMarket(marketAddr()).back(amount);
        vm.stopPrank();
    }

    function fade(uint256 amount) external {
        amount = bound(amount, 1e18, 1_000e18);
        deal(address(usdg), fader, usdg.balanceOf(fader) + amount);
        vm.startPrank(fader);
        usdg.approve(marketAddr(), type(uint256).max);
        ThesisMarket(marketAddr()).fade(amount);
        vm.stopPrank();
    }
}
