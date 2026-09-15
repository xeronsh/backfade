// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "../src/AggregatorV3Interface.sol";

/// @title MockV3Aggregator
/// @notice Chainlink-compatible feed with settable price for tests and local demo.
contract MockV3Aggregator is AggregatorV3Interface {
    uint8 public immutable decimalsOverride;
    int256 public latestAnswer;
    uint256 public latestUpdatedAt;

    constructor(uint8 decimals_, int256 initialAnswer) {
        require(initialAnswer > 0, "initial answer must be positive");
        decimalsOverride = decimals_;
        latestAnswer = initialAnswer;
        latestUpdatedAt = block.timestamp;
    }

    function updateAnswer(int256 newAnswer) external {
        require(newAnswer > 0, "answer must be positive");
        latestAnswer = newAnswer;
        latestUpdatedAt = block.timestamp;
    }

    function decimals() external view returns (uint8) {
        return decimalsOverride;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (1, latestAnswer, latestUpdatedAt, latestUpdatedAt, 1);
    }
}

/// @title BrokenV3Aggregator
/// @notice Feed-shaped contract with a settable (even invalid) timestamp, used to prove the
///         oracle guards reject future, zero and out-of-window observations.
contract BrokenV3Aggregator is AggregatorV3Interface {
    int256 public answer;
    uint256 public updatedAt;

    constructor(int256 answer_, uint256 updatedAt_) {
        answer = answer_;
        updatedAt = updatedAt_;
    }

    function setAnswer(int256 answer_) external {
        answer = answer_;
    }

    function setUpdatedAt(uint256 updatedAt_) external {
        updatedAt = updatedAt_;
    }

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, answer, updatedAt, updatedAt, 1);
    }
}
