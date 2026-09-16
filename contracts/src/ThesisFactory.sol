// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ThesisChallenge} from "./ThesisChallenge.sol";

/// @title ThesisFactory
/// @notice Deployment-configured factory for immutable social theses.
/// @dev There is no setter, governance role, proxy, or upgrade path.
contract ThesisFactory {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_BASKET_ASSETS = 5;
    uint256 public constant WEIGHTS_TOTAL_BPS = 10_000;

    IERC20 public immutable canonicalCollateral;
    uint64 public immutable challengeWindow;
    uint64 public immutable horizon;
    uint64 public immutable settlementWindow;
    uint256 public immutable maxStartAge;

    address[] public allowedFeeds;
    mapping(address => bool) public allowedFeed;
    address[] public theses;
    mapping(address => bool) public isThesis;

    error InvalidParams(string reason);

    event ThesisCreated(address indexed thesis, address indexed creator, uint256 creatorBond);

    constructor(
        address collateral_,
        address[] memory allowedFeeds_,
        uint64 challengeWindow_,
        uint64 horizon_,
        uint64 settlementWindow_,
        uint256 maxStartAge_
    ) {
        if (collateral_ == address(0) || collateral_.code.length == 0) {
            revert InvalidParams("invalid collateral");
        }
        if (challengeWindow_ == 0 || horizon_ <= challengeWindow_) revert InvalidParams("timing");
        if (settlementWindow_ == 0 || maxStartAge_ == 0) revert InvalidParams("oracle timing");
        canonicalCollateral = IERC20(collateral_);
        challengeWindow = challengeWindow_;
        horizon = horizon_;
        settlementWindow = settlementWindow_;
        maxStartAge = maxStartAge_;

        for (uint256 i = 0; i < allowedFeeds_.length; i++) {
            address feed = allowedFeeds_[i];
            if (feed == address(0) || feed.code.length == 0 || allowedFeed[feed]) {
                revert InvalidParams("feed allowlist");
            }
            allowedFeed[feed] = true;
            allowedFeeds.push(feed);
        }
        if (allowedFeeds.length == 0) revert InvalidParams("empty feed allowlist");
    }

    function createThesis(
        string calldata narrative,
        ThesisChallenge.BasketAsset[] calldata basket,
        address referenceFeed,
        uint256 creatorBond
    ) external returns (address thesis) {
        _validate(narrative, basket, referenceFeed, creatorBond);

        canonicalCollateral.safeTransferFrom(msg.sender, address(this), creatorBond);
        ThesisChallenge.BasketAsset[] memory basketCopy = new ThesisChallenge.BasketAsset[](basket.length);
        for (uint256 i = 0; i < basket.length; i++) {
            basketCopy[i] = basket[i];
        }

        ThesisChallenge.ThesisParams memory params = ThesisChallenge.ThesisParams({
            narrative: narrative,
            basket: basketCopy,
            referenceFeed: referenceFeed,
            challengeEndsAt: uint64(block.timestamp + challengeWindow),
            resolvesAt: uint64(block.timestamp + horizon),
            settlementWindow: settlementWindow,
            maxStartAge: maxStartAge,
            collateral: address(canonicalCollateral)
        });

        thesis = address(new ThesisChallenge(params, msg.sender, creatorBond));
        canonicalCollateral.safeTransfer(thesis, creatorBond);
        theses.push(thesis);
        isThesis[thesis] = true;
        emit ThesisCreated(thesis, msg.sender, creatorBond);
    }

    function thesesLength() external view returns (uint256) {
        return theses.length;
    }

    function thesisAt(uint256 index) external view returns (address) {
        return theses[index];
    }

    function allowedFeedsLength() external view returns (uint256) {
        return allowedFeeds.length;
    }

    function _validate(
        string calldata narrative,
        ThesisChallenge.BasketAsset[] calldata basket,
        address referenceFeed,
        uint256 creatorBond
    ) private view {
        if (creatorBond == 0) revert InvalidParams("zero bond");
        uint256 narrativeBytes = bytes(narrative).length;
        if (narrativeBytes == 0 || narrativeBytes > 280) revert InvalidParams("narrative");
        if (basket.length == 0 || basket.length > MAX_BASKET_ASSETS) revert InvalidParams("basket length");
        if (!allowedFeed[referenceFeed]) revert InvalidParams("reference feed");

        uint256 weightTotal;
        for (uint256 i = 0; i < basket.length; i++) {
            if (!allowedFeed[basket[i].feed] || basket[i].weightBps == 0) {
                revert InvalidParams("basket feed");
            }
            if (basket[i].feed == referenceFeed) revert InvalidParams("reference in basket");
            for (uint256 j = 0; j < i; j++) {
                if (basket[j].feed == basket[i].feed) revert InvalidParams("duplicate basket feed");
            }
            weightTotal += basket[i].weightBps;
        }
        if (weightTotal != WEIGHTS_TOTAL_BPS) revert InvalidParams("weights");
    }
}
