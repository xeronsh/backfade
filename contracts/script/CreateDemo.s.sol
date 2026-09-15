// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";

/// @notice The demo thesis: AI capex rotating into AMD + PLTR
///         versus a TSLA benchmark, hurdle +10%, on the live testnet seeded feeds.
contract CreateDemo is Script {
    address constant AMD_FEED = 0x5406FC983e7f84B544FF6fc855e06c22Cf36A795;
    address constant PLTR_FEED = 0x84206ED5EBF05B1519486742344d0499Df875Bd0;
    address constant TSLA_FEED = 0x81b48EC24970aA75Ae940e2492fdA006071aC31B;

    function run() external returns (address market) {
        uint256 pk = vm.envUint("CREATOR_PK");
        address factory = vm.envAddress("FACTORY");
        address usdg = vm.envAddress("USDG");
        uint64 resolvesIn = uint64(vm.envUint("RESOLVES_IN_SECONDS"));

        vm.startBroadcast(pk);
        IERC20(usdg).approve(factory, type(uint256).max);

        ThesisMarket.BasketAsset[] memory basket = new ThesisMarket.BasketAsset[](2);
        basket[0] = ThesisMarket.BasketAsset(AMD_FEED, 6000);
        basket[1] = ThesisMarket.BasketAsset(PLTR_FEED, 4000);

        ThesisMarket.MarketParams memory params = ThesisMarket.MarketParams({
            narrative: "AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA benchmark.",
            basket: basket,
            benchmarkFeed: TSLA_FEED,
            hurdleBps: 1000,
            bettingEndsAt: uint64(block.timestamp + 300),
            resolvesAt: uint64(block.timestamp) + resolvesIn,
            collateral: usdg
        });

        market = ThesisFactory(factory).createMarket(params, 500e18);
        vm.stopBroadcast();

        console2.log("market:", market);
        console2.log("bettingEndsAt:", ThesisMarket(market).bettingEndsAt());
        console2.log("resolvesAt:", ThesisMarket(market).resolvesAt());
        console2.log("settlementWindow:", ThesisMarket(market).settlementWindow());

        string memory j = "demo";
        vm.serializeUint(j, "bettingEndsAt", ThesisMarket(market).bettingEndsAt());
        vm.serializeUint(j, "resolvesAt", ThesisMarket(market).resolvesAt());
        vm.serializeUint(j, "startAmd", ThesisMarket(market).startPrices(0));
        vm.serializeUint(j, "startPltr", ThesisMarket(market).startPrices(1));
        string memory out = vm.serializeUint(j, "startTsla", ThesisMarket(market).startPrices(2));
        vm.writeFile("demo-final.json", out);
    }
}
