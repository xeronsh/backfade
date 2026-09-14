// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ThesisMarket} from "../src/ThesisMarket.sol";
import {ThesisFactory} from "../src/ThesisFactory.sol";
import {MockUSDG} from "../src/MockUSDG.sol";
import {MockV3Aggregator} from "./MockV3Aggregator.sol";

abstract contract BaseTest is Test {
    MockUSDG usdg;
    ThesisFactory factory;

    // basket: CEG 40% / VST 35% / GEV 25%, benchmark NVDA
    MockV3Aggregator cegFeed;
    MockV3Aggregator vstFeed;
    MockV3Aggregator gevFeed;
    MockV3Aggregator nvdaFeed;

    address creator = makeAddr("creator");
    address backer = makeAddr("backer");
    address fader = makeAddr("fader");

    uint256 constant BOND = 500e18;
    uint64 constant BETTING_END = 3 days;
    uint64 constant RESOLVES_AT = 30 days;

    function setUp() public virtual {
        usdg = new MockUSDG();
        factory = new ThesisFactory();

        cegFeed = new MockV3Aggregator(8, 200e8); // $200
        vstFeed = new MockV3Aggregator(8, 100e8); // $100
        gevFeed = new MockV3Aggregator(8, 300e8); // $300
        nvdaFeed = new MockV3Aggregator(8, 500e8); // $500

        usdg.mint(creator, 10_000e18);
        usdg.mint(backer, 10_000e18);
        usdg.mint(fader, 10_000e18);
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

    address marketAddr_;

    function setMarket(ThesisMarket m) internal {
        marketAddr_ = address(m);
    }

    function marketAddr() internal view returns (address) {
        return marketAddr_;
    }
}
