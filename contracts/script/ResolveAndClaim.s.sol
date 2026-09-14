// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Step 3 of the onchain demo: update prices, resolve, claim.
///         Prereq: betting closed AND chain time past resolvesAt.
contract ResolveAndClaim is Script {
    uint256 constant BACKER_KEY = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba; // anvil #2
    uint256 constant FADER_KEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d; // anvil #1
    uint256 constant CREATOR_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil #0

    function run() external {
        string memory json = vm.readFile("broadcasts/deploy.json");
        ThesisMarket market = ThesisMarket(vm.parseJsonAddress(json, ".market"));
        MockUSDG usdg = MockUSDG(vm.parseJsonAddress(json, ".usdg"));
        MockV3Aggregator ceg = MockV3Aggregator(vm.parseJsonAddress(json, ".ceg"));
        MockV3Aggregator vst = MockV3Aggregator(vm.parseJsonAddress(json, ".vst"));
        MockV3Aggregator gev = MockV3Aggregator(vm.parseJsonAddress(json, ".gev"));
        MockV3Aggregator nvda = MockV3Aggregator(vm.parseJsonAddress(json, ".nvda"));

        // prices move: basket +25%, benchmark +5% -> alpha +20% -> BACK wins
        vm.startBroadcast(CREATOR_KEY);
        ceg.updateAnswer(250e8);
        vst.updateAnswer(125e8);
        gev.updateAnswer(375e8);
        nvda.updateAnswer(525e8);
        console2.log("3 prices  updated");

        require(block.timestamp >= market.resolvesAt(), "advance chain time past resolvesAt first");
        market.resolve();
        console2.log("4 resolve outcome:", uint256(market.outcome())); // 1 = Back

        address creator = vm.addr(CREATOR_KEY);
        uint256 balBefore = usdg.balanceOf(creator);
        market.claim();
        console2.log("5 claim   payout:", usdg.balanceOf(creator) - balBefore);
        vm.stopBroadcast();

        require(uint256(market.outcome()) == 1, "expected BACK win");
        require(usdg.balanceOf(creator) > 10_000e18, "creator must profit");
        console2.log("E2E COMPLETE");
    }
}
