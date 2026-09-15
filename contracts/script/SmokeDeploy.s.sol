// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Anvil-only local stack for the ABI smoke test (PHASE 4.6 §14).
contract SmokeDeploy is Script {
    function run() external {
        uint256 pk = vm.envOr("SMOKE_PK", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        vm.startBroadcast(pk);
        MockUSDG usdg = new MockUSDG();
        MockV3Aggregator amd = new MockV3Aggregator(8, 490e8);
        MockV3Aggregator pltr = new MockV3Aggregator(8, 172e8);
        MockV3Aggregator tsla = new MockV3Aggregator(8, 359e8);
        ThesisFactory factory = new ThesisFactory();
        vm.stopBroadcast();

        string memory j = "smoke";
        vm.serializeAddress(j, "usdg", address(usdg));
        vm.serializeAddress(j, "amd", address(amd));
        vm.serializeAddress(j, "pltr", address(pltr));
        vm.serializeAddress(j, "tsla", address(tsla));
        string memory out = vm.serializeAddress(j, "factory", address(factory));
        vm.writeFile("smoke-state.json", out);
    }
}
