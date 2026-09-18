// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice One-shot local v0.2 demo: deploy, post, bond, and Fade a thesis.
/// @dev Anvil: forge script script/DemoCreate.s.sol --fork-url http://localhost:8545 --broadcast
contract DemoCreate is Script {
    function run() external {
        string memory json = "deploy";
        vm.startBroadcast(vm.envUint("DEMO_CREATOR_PK"));

        MockUSDG usdg = new MockUSDG();
        MockV3Aggregator ceg = new MockV3Aggregator(8, 200e8);
        MockV3Aggregator vst = new MockV3Aggregator(8, 100e8);
        MockV3Aggregator gev = new MockV3Aggregator(8, 300e8);
        MockV3Aggregator nvda = new MockV3Aggregator(8, 500e8);
        address[] memory feeds = new address[](4);
        feeds[0] = address(ceg);
        feeds[1] = address(vst);
        feeds[2] = address(gev);
        feeds[3] = address(nvda);
        ThesisFactory factory = new ThesisFactory(address(usdg), feeds, 10 minutes, 20 minutes, 30 minutes, 30 minutes);

        address creator = vm.addr(vm.envUint("DEMO_CREATOR_PK"));
        usdg.mint(creator, 10_000e18);
        usdg.mint(vm.addr(vm.envUint("DEMO_FADER_PK")), 10_000e18);
        usdg.mint(vm.addr(vm.envUint("DEMO_SECOND_FADER_PK")), 10_000e18);
        vm.serializeAddress(json, "usdg", address(usdg));
        vm.serializeAddress(json, "factory", address(factory));
        vm.serializeAddress(json, "ceg", address(ceg));
        vm.serializeAddress(json, "vst", address(vst));
        vm.serializeAddress(json, "gev", address(gev));
        vm.serializeAddress(json, "nvda", address(nvda));

        ThesisChallenge.BasketAsset[] memory basket = new ThesisChallenge.BasketAsset[](3);
        basket[0] = ThesisChallenge.BasketAsset(address(ceg), 4000);
        basket[1] = ThesisChallenge.BasketAsset(address(vst), 3500);
        basket[2] = ThesisChallenge.BasketAsset(address(gev), 2500);
        usdg.approve(address(factory), type(uint256).max);
        address thesisAddress =
            factory.createThesis("AI is rotating into nuclear energy.", basket, address(nvda), 1_000e18);
        ThesisChallenge thesis = ThesisChallenge(thesisAddress);
        string memory out = vm.serializeAddress(json, "thesis", thesisAddress);
        vm.writeFile("demo-state.json", out);
        console2.log("1 post + bond 1000 USDG:", thesisAddress);
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("DEMO_FADER_PK"));
        usdg.approve(address(thesis), type(uint256).max);
        thesis.challenge(300e18, "Unlock pressure is underestimated.");
        console2.log("2 fade 300 USDG");
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("DEMO_SECOND_FADER_PK"));
        usdg.approve(address(thesis), type(uint256).max);
        thesis.challenge(200e18, "Funding already looks crowded.");
        console2.log("3 fade 200 USDG");
        vm.stopBroadcast();

        console2.log("NEXT: advance chain time past resolvesAt and update all feeds, then run DemoResolve.s.sol");
    }
}
