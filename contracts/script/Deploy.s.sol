// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";

/// @notice Robinhood Chain Testnet deployment. Deployer key comes from the
///         environment and is never written to disk or printed.
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PK");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);

        MockUSDG usdg = new MockUSDG();
        ThesisFactory factory = new ThesisFactory();

        vm.stopBroadcast();

        console2.log("deployer:", deployer);
        console2.log("MockUSDG:", address(usdg));
        console2.log("ThesisFactory:", address(factory));

        string memory j = "final";
        vm.serializeAddress(j, "usdg", address(usdg));
        string memory out = vm.serializeAddress(j, "factory", address(factory));
        vm.writeFile("deployment.json", out);
    }
}
