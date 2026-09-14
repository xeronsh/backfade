// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";

/// @notice Testnet demo: create market using VERIFIED testnet feeds.
///         AMD 40% + PLTR 35% vs TSLA benchmark, hurdle +10%, 30-day window.
///         Requires env: USDG, FACTORY, TSLA_FEED, PLTR_FEED, AMD_FEED, CREATOR_KEY, TRADER_ADDR
contract CreateTestnetDemo is Script {
    function run() external {
        address usdg = vm.envAddress("USDG");
        address factory = vm.envAddress("FACTORY");
        address tslaFeed = vm.envAddress("TSLA_FEED");
        address pltrFeed = vm.envAddress("PLTR_FEED");
        address amdFeed = vm.envAddress("AMD_FEED");
        uint256 creatorKey = vm.envUint("CREATOR_KEY");
        address creator = vm.addr(creatorKey);

        vm.startBroadcast(creatorKey);
        MockUSDG(usdg).approve(factory, type(uint256).max);

        ThesisMarket.BasketAsset[] memory basket = new ThesisMarket.BasketAsset[](2);
        basket[0] = ThesisMarket.BasketAsset(amdFeed, 4000);
        basket[1] = ThesisMarket.BasketAsset(pltrFeed, 3500);
        // fix rounding: sum must be exactly 10000 -> put remainder in asset[1]
        basket[1].weightBps = 6000;
        ThesisMarket.MarketParams memory params = ThesisMarket.MarketParams({
            narrative: "AI capex keeps rotating into AMD and PLTR; both outperform TSLA.",
            basket: basket,
            benchmarkFeed: tslaFeed,
            hurdleBps: 1000,
            bettingEndsAt: uint64(block.timestamp + 30 minutes),
            resolvesAt: uint64(block.timestamp + 60 minutes),
            collateral: usdg
        });
        address market = ThesisFactory(factory).createMarket(params, 500e18);
        console2.log("MARKET:", market);
        console2.log("creator bond (BACK):", ThesisMarket(market).creatorBond());
        vm.stopBroadcast();
    }
}
