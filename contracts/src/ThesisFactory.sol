// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ThesisMarket} from "./ThesisMarket.sol";

/// @title ThesisFactory
/// @notice Validates constraints, pulls the creator bond, deploys a ThesisMarket.
/// @dev No settlement logic lives here. Events are the index.
contract ThesisFactory {
    using SafeERC20 for IERC20;

    /// @dev Defaults for the single testnet/demo deployment shape.
    /// @dev Calibrated from the live-testnet cadence probe: the feeds update every ~36-52s
    ///      (p99 under 6 min, one historical 21h outage). A 30 minute settlement window is
    ///      ~5x the p99 gap — short enough to leave little room to shop for an end price,
    ///      long enough that a normal feed hiccup cannot force a cancel. The 30 minute start
    ///      age is the same multiple, so an open market always starts on a fresh print
    ///      instead of accepting an arbitrarily stale creation price.
    uint64 public constant DEFAULT_SETTLEMENT_WINDOW = 30 minutes;
    uint256 public constant DEFAULT_MAX_START_AGE = 30 minutes;

    address[] public markets;
    mapping(address => bool) public isMarket;

    event MarketCreated(address indexed market, address indexed creator, uint256 creatorBond);

    error InvalidParams(string reason);

    function createMarket(ThesisMarket.MarketParams calldata params, uint256 creatorBond)
        external
        returns (address market)
    {
        if (creatorBond == 0) revert InvalidParams("zero bond");
        // collateral flows factory <- creator <- market in two hops:
        // 1. creator -> factory (this contract, already approved)
        // 2. factory -> market inside captureBond at construction
        IERC20(params.collateral).safeTransferFrom(msg.sender, address(this), creatorBond);
        market = address(
            new ThesisMarket(params, msg.sender, creatorBond, DEFAULT_SETTLEMENT_WINDOW, DEFAULT_MAX_START_AGE)
        );
        IERC20(params.collateral).safeTransfer(market, creatorBond);
        markets.push(market);
        isMarket[market] = true;

        emit MarketCreated(market, msg.sender, creatorBond);
    }

    function marketsLength() external view returns (uint256) {
        return markets.length;
    }

    function marketAt(uint256 index) external view returns (address) {
        return markets[index];
    }
}
