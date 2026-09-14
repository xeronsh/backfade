// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ThesisMarket} from "./ThesisMarket.sol";

/// @title ThesisFactory
/// @notice Validates constraints, pulls the creator bond, deploys a ThesisMarket.
/// @dev No settlement logic lives here. Events are the index.
contract ThesisFactory {
    using SafeERC20 for IERC20;

    address[] public markets;
    mapping(address => bool) public isMarket;

    event MarketCreated(address indexed market, address indexed creator, uint256 creatorBond);

    error InvalidParams(string reason);

    function createMarket(
        ThesisMarket.MarketParams calldata params,
        uint256 creatorBond
    ) external returns (address market) {
        if (creatorBond == 0) revert InvalidParams("zero bond");
        // collateral flows factory <- creator <- market in two hops:
        // 1. creator -> factory (this contract, already approved)
        // 2. factory -> market inside captureBond at construction
        IERC20(params.collateral).safeTransferFrom(msg.sender, address(this), creatorBond);
        market = address(new ThesisMarket(params, msg.sender, creatorBond));
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
