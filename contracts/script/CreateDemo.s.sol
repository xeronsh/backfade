// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";

/// @notice Create the v0.2 demo thesis against an already deployed factory.
contract CreateDemo is Script {
    address constant AMD_FEED = 0x5406FC983e7f84B544FF6fc855e06c22Cf36A795;
    address constant PLTR_FEED = 0x84206ED5EBF05B1519486742344d0499Df875Bd0;
    address constant TSLA_FEED = 0x81b48EC24970aA75Ae940e2492fdA006071aC31B;

    function run() external returns (address thesis) {
        uint256 pk = vm.envUint("CREATOR_PK");
        address factory = vm.envAddress("FACTORY");
        address usdg = vm.envAddress("USDG");

        vm.startBroadcast(pk);
        IERC20(usdg).approve(factory, type(uint256).max);
        ThesisChallenge.BasketAsset[] memory basket = new ThesisChallenge.BasketAsset[](2);
        basket[0] = ThesisChallenge.BasketAsset(AMD_FEED, 6000);
        basket[1] = ThesisChallenge.BasketAsset(PLTR_FEED, 4000);
        thesis = ThesisFactory(factory)
            .createThesis(
                "AI infrastructure keeps outperforming: AMD and PLTR beat a TSLA reference.",
                basket,
                TSLA_FEED,
                8 hours,
                1_000,
                1_000e18
            );
        vm.stopBroadcast();

        ThesisChallenge challenge = ThesisChallenge(thesis);
        console2.log("thesis:", thesis);
        console2.log("challengeEndsAt:", challenge.challengeEndsAt());
        console2.log("resolvesAt:", challenge.resolvesAt());
    }
}
