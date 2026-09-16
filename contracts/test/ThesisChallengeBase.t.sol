// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "./MockV3Aggregator.sol";

abstract contract ThesisChallengeBase is Test {
    MockUSDG usdg;
    ThesisFactory factory;
    MockV3Aggregator assetA;
    MockV3Aggregator assetB;
    MockV3Aggregator refFeed;
    address creator = makeAddr("creator-v2");
    address faderA = makeAddr("fader-a-v2");
    address faderB = makeAddr("fader-b-v2");
    address outsider = makeAddr("outsider-v2");

    uint256 internal constant BOND = 1_000e18;
    uint64 internal constant CHALLENGE_WINDOW = 30 minutes;
    uint64 internal constant HORIZON = 7 days;
    uint64 internal constant SETTLEMENT_WINDOW = 30 minutes;
    uint256 internal constant MAX_START_AGE = 30 minutes;

    function setUp() public virtual {
        usdg = new MockUSDG();
        assetA = new MockV3Aggregator(8, 200e8);
        assetB = new MockV3Aggregator(8, 100e8);
        refFeed = new MockV3Aggregator(8, 500e8);
        address[] memory feeds = new address[](3);
        feeds[0] = address(assetA);
        feeds[1] = address(assetB);
        feeds[2] = address(refFeed);
        factory = new ThesisFactory(address(usdg), feeds, CHALLENGE_WINDOW, HORIZON, SETTLEMENT_WINDOW, MAX_START_AGE);
        usdg.mint(creator, 100_000e18);
        usdg.mint(faderA, 100_000e18);
        usdg.mint(faderB, 100_000e18);
        usdg.mint(outsider, 100_000e18);
    }

    function createThesis(uint256 bond) internal returns (ThesisChallenge thesis) {
        ThesisChallenge.BasketAsset[] memory basket = new ThesisChallenge.BasketAsset[](2);
        basket[0] = ThesisChallenge.BasketAsset(address(assetA), 6_000);
        basket[1] = ThesisChallenge.BasketAsset(address(assetB), 4_000);
        vm.startPrank(creator);
        usdg.approve(address(factory), type(uint256).max);
        thesis = ThesisChallenge(
            factory.createThesis("A capital-backed thesis about relative performance.", basket, address(refFeed), bond)
        );
        vm.stopPrank();
    }

    function createDefaultThesis() internal returns (ThesisChallenge thesis) {
        return createThesis(BOND);
    }

    function approveAndChallenge(ThesisChallenge thesis, address who, uint256 amount, string memory note) internal {
        vm.startPrank(who);
        usdg.approve(address(thesis), amount);
        thesis.challenge(amount, note);
        vm.stopPrank();
    }

    function approveAndRaise(ThesisChallenge thesis, uint256 amount, string memory note) internal {
        vm.startPrank(creator);
        usdg.approve(address(thesis), amount);
        thesis.raiseConviction(amount, note);
        vm.stopPrank();
    }

    function advanceToExpiry(ThesisChallenge thesis) internal {
        vm.warp(thesis.resolvesAt());
    }

    function publishPrices(uint256 assetAPrice, uint256 assetBPrice, uint256 referencePrice) internal {
        assetA.updateAnswer(int256(assetAPrice));
        assetB.updateAnswer(int256(assetBPrice));
        refFeed.updateAnswer(int256(referencePrice));
    }
}
