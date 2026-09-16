// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ThesisMarket} from "../src/legacy/ThesisMarket.sol";
import {LegacyThesisFactory} from "../src/legacy/LegacyThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "./MockV3Aggregator.sol";

abstract contract BaseTest is Test {
    MockUSDG usdg;
    LegacyThesisFactory factory;

    // basket: CEG 40% / VST 35% / GEV 25%, benchmark NVDA
    MockV3Aggregator cegFeed;
    MockV3Aggregator vstFeed;
    MockV3Aggregator gevFeed;
    MockV3Aggregator nvdaFeed;

    address creator = makeAddr("creator");
    address backer = makeAddr("backer");
    address fader = makeAddr("fader");
    address third = makeAddr("third");

    uint256 constant BOND = 500e18;
    uint64 public constant BETTING_END = 3 days;
    uint64 public constant RESOLVES_AT = 30 days;
    /// @dev Mirrors the factory defaults so tests exercise the shipped production shape.
    uint64 constant DEFAULT_WINDOW = 30 minutes;
    uint256 constant DEFAULT_START_AGE = 30 minutes;

    function setUp() public virtual {
        usdg = new MockUSDG();
        factory = new LegacyThesisFactory();

        cegFeed = new MockV3Aggregator(8, 200e8); // $200
        vstFeed = new MockV3Aggregator(8, 100e8); // $100
        gevFeed = new MockV3Aggregator(8, 300e8); // $300
        nvdaFeed = new MockV3Aggregator(8, 500e8); // $500

        usdg.mint(creator, 10_000e18);
        usdg.mint(backer, 10_000e18);
        usdg.mint(fader, 10_000e18);
        usdg.mint(third, 10_000e18);
    }

    function defaultParams() internal view returns (ThesisMarket.MarketParams memory p) {
        ThesisMarket.BasketAsset[] memory basket = new ThesisMarket.BasketAsset[](3);
        basket[0] = ThesisMarket.BasketAsset(address(cegFeed), 4000);
        basket[1] = ThesisMarket.BasketAsset(address(vstFeed), 3500);
        basket[2] = ThesisMarket.BasketAsset(address(gevFeed), 2500);
        p = ThesisMarket.MarketParams({
            narrative: "AI is rotating into nuclear energy.",
            basket: basket,
            benchmarkFeed: address(nvdaFeed),
            hurdleBps: 1000,
            bettingEndsAt: uint64(block.timestamp + BETTING_END),
            resolvesAt: uint64(block.timestamp + RESOLVES_AT),
            collateral: address(usdg)
        });
    }

    function createDefaultMarket() internal returns (ThesisMarket market) {
        vm.startPrank(creator);
        usdg.approve(address(factory), type(uint256).max);
        market = ThesisMarket(factory.createMarket(defaultParams(), BOND));
        vm.stopPrank();
    }

    /// @dev Direct-deploy path: the constructor assumes the factory already delivered the
    ///      bond, so the test funds the market explicitly. Lets tests pick bond/window/age.
    function deployMarket(ThesisMarket.MarketParams memory p, uint256 bond) internal returns (ThesisMarket market) {
        return deployMarketWith(p, bond, factory.DEFAULT_SETTLEMENT_WINDOW(), factory.DEFAULT_MAX_START_AGE());
    }

    function deployMarketWith(
        ThesisMarket.MarketParams memory p,
        uint256 bond,
        uint64 settlementWindow_,
        uint256 maxStartAge_
    ) internal returns (ThesisMarket market) {
        market = new ThesisMarket(p, creator, bond, settlementWindow_, maxStartAge_);
        vm.prank(creator);
        usdg.transfer(address(market), bond);
    }

    function backFrom(address who, uint256 amount) internal {
        vm.startPrank(who);
        usdg.approve(address(marketAddr()), amount);
        ThesisMarket(marketAddr()).back(amount);
        vm.stopPrank();
    }

    function fadeFrom(address who, uint256 amount) internal {
        vm.startPrank(who);
        usdg.approve(address(marketAddr()), amount);
        ThesisMarket(marketAddr()).fade(amount);
        vm.stopPrank();
    }

    /// @dev Move to just past resolvesAt and print prices that make BACK win (alpha > hurdle).
    ///      Timestamps come from the mock feed's own clock, so the prints can never be
    ///      stamped before the warped `resolvesAt` and are always inside the window.
    function warpAndPrintBackWins() internal {
        vm.warp(block.timestamp + RESOLVES_AT + 1);
        // basket +25%, benchmark +5% => alpha +20% >= 10% hurdle
        cegFeed.updateAnswer(250e8);
        vstFeed.updateAnswer(125e8);
        gevFeed.updateAnswer(375e8);
        nvdaFeed.updateAnswer(525e8);
    }

    /// @dev Move to just past resolvesAt and print prices that make FADE win (alpha < hurdle).
    function warpAndPrintFadeWins() internal {
        vm.warp(block.timestamp + RESOLVES_AT + 1);
        // basket -5%, benchmark +2% => alpha -7% < hurdle
        cegFeed.updateAnswer(190e8);
        vstFeed.updateAnswer(95e8);
        gevFeed.updateAnswer(285e8);
        nvdaFeed.updateAnswer(510e8);
    }

    address marketAddr_;

    function setMarket(ThesisMarket m) internal {
        marketAddr_ = address(m);
    }

    function marketAddr() internal view returns (address) {
        return marketAddr_;
    }
}
