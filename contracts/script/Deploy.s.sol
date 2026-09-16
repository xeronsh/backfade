// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";

/// @notice Robinhood Chain Testnet v0.2 deployment. Keys are read from the environment.
contract Deploy is Script {
    address constant AMD_FEED = 0x5406FC983e7f84B544FF6fc855e06c22Cf36A795;
    address constant PLTR_FEED = 0x84206ED5EBF05B1519486742344d0499Df875Bd0;
    address constant NVDA_FEED = 0xBf15aA8CB0f376DB8fcb309347CB7375567bEC6B;
    address constant TSLA_FEED = 0x81b48EC24970aA75Ae940e2492fdA006071aC31B;
    address constant COIN_FEED = 0x1f1699510abfdAd90D82e2624136224B6b4EC7C8;

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PK");
        address deployer = vm.addr(pk);
        uint64 challengeWindow = uint64(vm.envOr("V2_CHALLENGE_WINDOW", uint256(30 minutes)));
        uint64 horizon = uint64(vm.envOr("V2_HORIZON", uint256(7 days)));
        uint64 settlementWindow = uint64(vm.envOr("V2_SETTLEMENT_WINDOW", uint256(30 minutes)));
        uint256 maxStartAge = vm.envOr("V2_MAX_START_AGE", uint256(30 minutes));
        address[] memory feeds = new address[](5);
        feeds[0] = AMD_FEED;
        feeds[1] = PLTR_FEED;
        feeds[2] = NVDA_FEED;
        feeds[3] = TSLA_FEED;
        feeds[4] = COIN_FEED;

        vm.startBroadcast(pk);
        MockUSDG usdg = new MockUSDG();
        ThesisFactory factory =
            new ThesisFactory(address(usdg), feeds, challengeWindow, horizon, settlementWindow, maxStartAge);
        vm.stopBroadcast();

        console2.log("deployer:", deployer);
        console2.log("MockUSDG:", address(usdg));
        console2.log("ThesisFactory v0.2:", address(factory));
        console2.log("challengeWindow:", challengeWindow);
        console2.log("horizon:", horizon);
        console2.log("settlementWindow:", settlementWindow);

        string memory j = "final";
        vm.serializeAddress(j, "usdg", address(usdg));
        string memory out = vm.serializeAddress(j, "factory", address(factory));
        vm.writeFile("deployment-v0.2.json", out);
    }
}
