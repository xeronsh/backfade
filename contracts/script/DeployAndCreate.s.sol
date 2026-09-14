// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Step 1 of the onchain demo: deploy everything + create market with creator bond.
/// @dev Writes deployed addresses to broadcasts/deploy.json for step 2.
contract DeployAndCreate is Script {
    function run() external {
        uint256 creatorKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil #0
        address creator = vm.addr(creatorKey);
        vm.startBroadcast(creatorKey);

        MockUSDG usdg = new MockUSDG();
        ThesisFactory factory = new ThesisFactory();
        MockV3Aggregator ceg = new MockV3Aggregator(8, 200e8);
        MockV3Aggregator vst = new MockV3Aggregator(8, 100e8);
        MockV3Aggregator gev = new MockV3Aggregator(8, 300e8);
        MockV3Aggregator nvda = new MockV3Aggregator(8, 500e8);

        usdg.mint(creator, 10_000e18);
        usdg.mint(vm.addr(0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba), 10_000e18);
        usdg.mint(vm.addr(0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d), 10_000e18);

        ThesisMarket.BasketAsset[] memory basket = new ThesisMarket.BasketAsset[](3);
        basket[0] = ThesisMarket.BasketAsset(address(ceg), 4000);
        basket[1] = ThesisMarket.BasketAsset(address(vst), 3500);
        basket[2] = ThesisMarket.BasketAsset(address(gev), 2500);
        ThesisMarket.MarketParams memory params = ThesisMarket.MarketParams({
            narrative: "AI is rotating into nuclear energy.",
            basket: basket,
            benchmarkFeed: address(nvda),
            hurdleBps: 1000,
            bettingEndsAt: uint64(block.timestamp + 10 minutes),
            resolvesAt: uint64(block.timestamp + 20 minutes),
            collateral: address(usdg)
        });
        usdg.approve(address(factory), type(uint256).max);
        address market = factory.createMarket(params, 500e18);
        vm.stopBroadcast();

        string memory json = "deploy";
        vm.serializeAddress(json, "usdg", address(usdg));
        vm.serializeAddress(json, "factory", address(factory));
        vm.serializeAddress(json, "ceg", address(ceg));
        vm.serializeAddress(json, "vst", address(vst));
        vm.serializeAddress(json, "gev", address(gev));
        vm.serializeAddress(json, "nvda", address(nvda));
        string memory out = vm.serializeAddress(json, "market", market);
        vm.writeFile("broadcasts/deploy.json", out);

        console2.log("market:", market);
        console2.log("creator bond captured as BACK:", ThesisMarket(market).creatorBond());
    }
}
