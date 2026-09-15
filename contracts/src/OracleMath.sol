// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";

/// @title OracleMath
/// @notice Deterministic weighted-basket excess-return math over Chainlink-style feeds.
/// @dev All prices normalized to 18 decimals before return computation.
library OracleMath {
    uint256 internal constant PRICE_DECIMALS = 18;
    int256 internal constant BPS_DENOMINATOR = 10_000;

    /// @notice Normalized price: feed answer scaled to 18 decimals.
    function normalizePrice(int256 answer, uint8 feedDecimals) internal pure returns (uint256) {
        require(answer > 0, "OracleMath: invalid price");
        if (feedDecimals <= PRICE_DECIMALS) {
            return uint256(answer) * 10 ** (PRICE_DECIMALS - feedDecimals);
        }
        return uint256(answer) / 10 ** (feedDecimals - PRICE_DECIMALS);
    }

    /// @notice assetReturn_i = endPrice_i / startPrice_i - 1, in bps, signed.
    function returnBps(uint256 startPrice, uint256 endPrice) internal pure returns (int256) {
        require(startPrice > 0, "OracleMath: zero start price");
        // scale by 1e18 to preserve precision before bps conversion
        int256 scaled = int256((endPrice * 1e18) / startPrice) - 1e18;
        return (scaled * BPS_DENOMINATOR) / 1e18;
    }

    /// @notice basketReturn = sum(weight_i * return_i) / 10000, in bps, signed.
    /// @dev Sums the weighted returns first and divides once — less truncation loss.
    function weightedReturnBps(int256[] memory returnBpsList, uint16[] memory weightsBps)
        internal
        pure
        returns (int256)
    {
        require(returnBpsList.length == weightsBps.length, "OracleMath: length mismatch");
        int256 sum;
        for (uint256 i = 0; i < returnBpsList.length; i++) {
            sum += returnBpsList[i] * int256(uint256(weightsBps[i]));
        }
        return sum / BPS_DENOMINATOR;
    }

    /// @notice Read the latest price from a feed for market creation, enforcing freshness.
    /// @dev Requires the feed to exist, carry a positive answer and a real update timestamp
    ///      no older than maxAgeSeconds. Used for the immutable start price.
    function latestPrice(AggregatorV3Interface feed, uint256 maxAgeSeconds)
        internal
        view
        returns (uint256 price, uint8 decimals)
    {
        (int256 answer, uint256 updatedAt, uint8 feedDecimals) = _readFeed(feed);
        require(updatedAt <= block.timestamp, "OracleMath: future update");
        require(block.timestamp - updatedAt <= maxAgeSeconds, "OracleMath: stale price");
        decimals = feedDecimals;
        price = normalizePrice(answer, feedDecimals);
    }

    /// @notice Read the latest price for settlement, bounded to a timestamp window.
    /// @dev This is the anti-manipulation core: `minUpdatedAt` (the market's resolvesAt)
    ///      forbids settling on a price observed before expiry, and `maxUpdatedAt`
    ///      bounds how late a settlement observation may be taken.
    function boundedPrice(AggregatorV3Interface feed, uint256 minUpdatedAt, uint256 maxUpdatedAt)
        internal
        view
        returns (uint256 price)
    {
        (int256 answer, uint256 updatedAt, uint8 feedDecimals) = _readFeed(feed);
        require(updatedAt >= minUpdatedAt, "OracleMath: pre-expiry price");
        require(updatedAt <= maxUpdatedAt, "OracleMath: price outside window");
        require(updatedAt <= block.timestamp, "OracleMath: future update");
        price = normalizePrice(answer, feedDecimals);
    }

    /// @dev Shared feed validity guards: code exists, answer positive, updatedAt set.
    function _readFeed(AggregatorV3Interface feed)
        private
        view
        returns (int256 answer, uint256 updatedAt, uint8 feedDecimals)
    {
        require(address(feed).code.length > 0, "OracleMath: feed has no code");
        (, answer,, updatedAt,) = feed.latestRoundData();
        require(answer > 0, "OracleMath: non-positive answer");
        require(updatedAt > 0, "OracleMath: zero updatedAt");
        feedDecimals = feed.decimals();
        require(feedDecimals <= 36, "OracleMath: bad decimals");
    }
}
