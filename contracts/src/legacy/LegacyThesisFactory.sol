// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ThesisMarket} from "./ThesisMarket.sol";

/// @title LegacyThesisFactory
/// @notice v0.1 binary factory retained only so historical tests and artifacts remain reproducible.
/// @dev The v0.2 product uses ThesisFactory and ThesisChallenge instead.
contract LegacyThesisFactory {
    using SafeERC20 for IERC20;

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
