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
        // A redeploy should not strand test wallets: reuse the deployed collateral
        // unless the caller explicitly wants a fresh one.
        address collateral_ = vm.envOr("V2_COLLATERAL", address(0));
        uint64 challengeWindow = uint64(vm.envOr("V2_CHALLENGE_WINDOW", uint256(45 seconds)));
        uint64[] memory horizons = new uint64[](5);
        horizons[0] = uint64(vm.envOr("V2_HORIZON_5M", uint256(5 minutes)));
        horizons[1] = uint64(vm.envOr("V2_HORIZON_1H", uint256(1 hours)));
        horizons[2] = uint64(vm.envOr("V2_HORIZON_8H", uint256(8 hours)));
        horizons[3] = uint64(vm.envOr("V2_HORIZON_1D", uint256(1 days)));
        horizons[4] = uint64(vm.envOr("V2_HORIZON_1W", uint256(7 days)));
        uint64 settlementWindow = uint64(vm.envOr("V2_SETTLEMENT_WINDOW", uint256(30 minutes)));
        uint256 maxStartAge = vm.envOr("V2_MAX_START_AGE", uint256(30 minutes));
        address[] memory feeds = new address[](5);
        feeds[0] = AMD_FEED;
        feeds[1] = PLTR_FEED;
        feeds[2] = NVDA_FEED;
        feeds[3] = TSLA_FEED;
        feeds[4] = COIN_FEED;

        vm.startBroadcast(pk);
        address collateral = collateral_ == address(0) ? address(new MockUSDG()) : collateral_;
        ThesisFactory factory =
            new ThesisFactory(collateral, feeds, challengeWindow, horizons, settlementWindow, maxStartAge);
        vm.stopBroadcast();

        console2.log("deployer:", deployer);
        console2.log("collateral:", collateral);
        console2.log("ThesisFactory v0.2:", address(factory));
        console2.log("challengeWindow:", challengeWindow);
        console2.log("horizons:", horizons.length);
        console2.log("settlementWindow:", settlementWindow);

        string memory j = "final";
        vm.serializeAddress(j, "usdg", collateral);
        string memory out = vm.serializeAddress(j, "factory", address(factory));
        vm.writeFile("deployment-v0.2.json", out);
    }
}
