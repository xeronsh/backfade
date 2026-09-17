// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "../test/MockV3Aggregator.sol";
import {LocalMulticall3} from "../src/LocalMulticall3.sol";

/// @notice Anvil-only local stack used by the ABI smoke test.
contract SmokeDeploy is Script {
    function run() external {
        uint256 pk = vm.envUint("SMOKE_PK");
        uint64 challengeWindow = uint64(vm.envOr("SMOKE_CHALLENGE_WINDOW", uint256(30 minutes)));
        uint64 horizon = uint64(vm.envOr("SMOKE_HORIZON", uint256(7 days)));
        uint64 settlementWindow = uint64(vm.envOr("SMOKE_SETTLEMENT_WINDOW", uint256(30 minutes)));
        uint256 maxStartAge = vm.envOr("SMOKE_MAX_START_AGE", uint256(30 minutes));
        vm.startBroadcast(pk);
        MockUSDG usdg = new MockUSDG();
        MockV3Aggregator amd = new MockV3Aggregator(8, 490e8);
        MockV3Aggregator pltr = new MockV3Aggregator(8, 172e8);
        MockV3Aggregator tsla = new MockV3Aggregator(8, 359e8);
        address[] memory feeds = new address[](3);
        feeds[0] = address(amd);
        feeds[1] = address(pltr);
        feeds[2] = address(tsla);
        ThesisFactory factory =
            new ThesisFactory(address(usdg), feeds, challengeWindow, horizon, settlementWindow, maxStartAge);
        LocalMulticall3 multicall = new LocalMulticall3();
        vm.stopBroadcast();

        string memory j = "smoke";
        vm.serializeAddress(j, "usdg", address(usdg));
        vm.serializeAddress(j, "amd", address(amd));
        vm.serializeAddress(j, "pltr", address(pltr));
        vm.serializeAddress(j, "tsla", address(tsla));
        vm.serializeAddress(j, "multicall", address(multicall));
        string memory out = vm.serializeAddress(j, "factory", address(factory));
        vm.writeFile("smoke-state.json", out);
        console2.log("v0.2 factory:", address(factory));
    }
}
