// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";

/// @notice Anvil-only local stack used by the ABI smoke test.
contract SmokeDeploy is Script {
    function run() external {
        uint256 pk = vm.envUint("SMOKE_PK");
        vm.startBroadcast(pk);
        MockUSDG usdg = new MockUSDG();
        MockV3Aggregator amd = new MockV3Aggregator(8, 490e8);
        MockV3Aggregator pltr = new MockV3Aggregator(8, 172e8);
        MockV3Aggregator tsla = new MockV3Aggregator(8, 359e8);
        address[] memory feeds = new address[](3);
        feeds[0] = address(amd);
        feeds[1] = address(pltr);
        feeds[2] = address(tsla);
        ThesisFactory factory = new ThesisFactory(address(usdg), feeds, 30 minutes, 7 days, 30 minutes, 30 minutes);
        vm.stopBroadcast();

        string memory j = "smoke";
        vm.serializeAddress(j, "usdg", address(usdg));
        vm.serializeAddress(j, "amd", address(amd));
        vm.serializeAddress(j, "pltr", address(pltr));
        vm.serializeAddress(j, "tsla", address(tsla));
        string memory out = vm.serializeAddress(j, "factory", address(factory));
        vm.writeFile("smoke-state.json", out);
        console2.log("v0.2 factory:", address(factory));
    }
}
