// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

contract Deploy is Script {
    function run() external returns (ThesisFactory factory, MockUSDG usdg) {
        uint256 pk = vm.envUint("DEPLOYER_KEY");
        vm.startBroadcast(pk);

        usdg = new MockUSDG();
        // demo feed set: CEG VST GEV + benchmark NVDA
        new MockV3Aggregator(8, 200e8); // CEG
        new MockV3Aggregator(8, 100e8); // VST
        new MockV3Aggregator(8, 300e8); // GEV
        new MockV3Aggregator(8, 500e8); // NVDA
        factory = new ThesisFactory();

        vm.stopBroadcast();
    }
}
