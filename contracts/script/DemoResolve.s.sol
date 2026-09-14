// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Demo step 2: update prices, resolve, claim. Requires chain time past
///         resolvesAt AND betting closed (advance time on anvil between the two scripts).
contract DemoResolve is Script {
    uint256 constant CREATOR_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; // anvil #0

    function run() external {
        string memory json = vm.readFile("demo-state.json");
        ThesisMarket market = ThesisMarket(vm.parseJsonAddress(json, ".market"));
        MockUSDG usdg = MockUSDG(vm.parseJsonAddress(json, ".usdg"));
        MockV3Aggregator ceg = MockV3Aggregator(vm.parseJsonAddress(json, ".ceg"));
        MockV3Aggregator vst = MockV3Aggregator(vm.parseJsonAddress(json, ".vst"));
        MockV3Aggregator gev = MockV3Aggregator(vm.parseJsonAddress(json, ".gev"));
        MockV3Aggregator nvda = MockV3Aggregator(vm.parseJsonAddress(json, ".nvda"));

        vm.startBroadcast(CREATOR_KEY);
        // basket +25%, benchmark +5% -> alpha +20% >= 10% hurdle -> BACK wins
        ceg.updateAnswer(250e8);
        vst.updateAnswer(125e8);
        gev.updateAnswer(375e8);
        nvda.updateAnswer(525e8);
        console2.log("1 prices  updated");

        if (block.timestamp < market.resolvesAt()) {
            console2.log("TIME TRAVEL NEEDED: cast rpc evm_setNextBlockTimestamp <resolvesAt+1> && cast rpc evm_mine");
            revert("advance chain time past resolvesAt first");
        }
        market.resolve();
        console2.log("2 resolve outcome:", uint256(market.outcome())); // 1 = Back

        address creator = vm.addr(CREATOR_KEY);
        uint256 balBefore = usdg.balanceOf(creator);
        market.claim();
        console2.log("3 claim   payout:", usdg.balanceOf(creator) - balBefore);
        vm.stopBroadcast();

        require(uint256(market.outcome()) == 1, "expected BACK win");
        require(usdg.balanceOf(creator) > 10_000e18, "creator must profit");
        console2.log("E2E COMPLETE: create -> back -> fade -> resolve -> claim");
    }
}
