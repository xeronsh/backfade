// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Demo step 2: publish post-expiry prices, settle, and pull all claims.
contract DemoResolve is Script {
    function run() external {
        string memory json = vm.readFile("demo-state.json");
        ThesisChallenge thesis = ThesisChallenge(vm.parseJsonAddress(json, ".thesis"));
        MockUSDG usdg = MockUSDG(vm.parseJsonAddress(json, ".usdg"));
        MockV3Aggregator ceg = MockV3Aggregator(vm.parseJsonAddress(json, ".ceg"));
        MockV3Aggregator vst = MockV3Aggregator(vm.parseJsonAddress(json, ".vst"));
        MockV3Aggregator gev = MockV3Aggregator(vm.parseJsonAddress(json, ".gev"));
        MockV3Aggregator nvda = MockV3Aggregator(vm.parseJsonAddress(json, ".nvda"));

        vm.startBroadcast(vm.envUint("DEMO_CREATOR_PK"));
        ceg.updateAnswer(250e8);
        vst.updateAnswer(125e8);
        gev.updateAnswer(375e8);
        nvda.updateAnswer(525e8);
        if (block.timestamp < thesis.resolvesAt()) revert("advance chain time past resolvesAt first");
        thesis.settle();
        thesis.claim();
        console2.log("1 settle alpha:", thesis.realizedAlphaBps());
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("DEMO_FADER_PK"));
        thesis.claim();
        vm.stopBroadcast();

        vm.startBroadcast(vm.envUint("DEMO_SECOND_FADER_PK"));
        thesis.claim();
        vm.stopBroadcast();

        require(usdg.balanceOf(address(thesis)) <= 1, "unexpected collateral remains");
        console2.log("E2E COMPLETE: post -> fade -> settle -> claims");
    }
}
