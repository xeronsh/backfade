// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "./MockV3Aggregator.sol";

contract ChallengeHandler is Test {
    ThesisChallenge immutable thesis;
    MockUSDG immutable collateral;

    constructor(ThesisChallenge thesis_, MockUSDG collateral_) {
        thesis = thesis_;
        collateral = collateral_;
        collateral_.mint(address(this), type(uint128).max);
    }

    function postChallenge(uint96 seed) external {
        uint256 bounty = thesis.openBounty();
        if (bounty == 0 || thesis.state() != ThesisChallenge.State.OPEN) return;
        uint256 amount = bound(uint256(seed), 1, bounty);
        collateral.approve(address(thesis), amount);
        thesis.challenge(amount, "invariant challenge");
    }
}

contract ThesisChallengeInvariantTest is Test {
    MockUSDG internal usdg;
    ThesisChallenge internal thesis;
    address internal creator;

    function setUp() public {
        creator = vm.addr(1);
        usdg = new MockUSDG();
        MockV3Aggregator assetA = new MockV3Aggregator(8, 200e8);
        MockV3Aggregator assetB = new MockV3Aggregator(8, 100e8);
        MockV3Aggregator refFeed = new MockV3Aggregator(8, 500e8);
        address[] memory feeds = new address[](3);
        feeds[0] = address(assetA);
        feeds[1] = address(assetB);
        feeds[2] = address(refFeed);
        uint64[] memory horizons = new uint64[](1);
        horizons[0] = 7 days;
        ThesisFactory factory = new ThesisFactory(address(usdg), feeds, 30 minutes, horizons, 30 minutes, 30 minutes);
        usdg.mint(creator, 1_000e18);
        ThesisChallenge.BasketAsset[] memory basket = new ThesisChallenge.BasketAsset[](2);
        basket[0] = ThesisChallenge.BasketAsset(address(assetA), 6_000);
        basket[1] = ThesisChallenge.BasketAsset(address(assetB), 4_000);
        vm.startPrank(creator);
        usdg.approve(address(factory), type(uint256).max);
        thesis = ThesisChallenge(
            factory.createThesis("Invariant thesis", basket, address(refFeed), 7 days, 1_000, 1_000e18)
        );
        vm.stopPrank();

        ChallengeHandler handler = new ChallengeHandler(thesis, usdg);
        targetContract(address(handler));
    }

    function invariant_ChallengePoolIsAlwaysCovered() public view {
        assertLe(thesis.challengePool(), thesis.creatorBond());
        assertEq(thesis.openBounty(), thesis.creatorBond() - thesis.challengePool());
    }
}
