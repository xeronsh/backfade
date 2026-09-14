// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Step 2 of the onchain demo: BACK + FADE. Run while betting is still open.
contract BackAndFade is Script {
    uint256 constant BACKER_KEY = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba; // anvil #2
    uint256 constant FADER_KEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d; // anvil #1
    uint256 constant CREATOR_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil #0

    function run() external {
        string memory json = vm.readFile("broadcasts/deploy.json");
        ThesisMarket market = ThesisMarket(vm.parseJsonAddress(json, ".market"));
        MockUSDG usdg = MockUSDG(vm.parseJsonAddress(json, ".usdg"));

        // BACK
        vm.startBroadcast(BACKER_KEY);
        usdg.approve(address(market), type(uint256).max);
        market.back(300e18);
        console2.log("1 back    300 USDG");
        vm.stopBroadcast();

        // FADE
        vm.startBroadcast(FADER_KEY);
        usdg.approve(address(market), type(uint256).max);
        market.fade(100e18);
        console2.log("2 fade    100 USDG");
        vm.stopBroadcast();

        console2.log("BACK/FADE done");
    }
}
