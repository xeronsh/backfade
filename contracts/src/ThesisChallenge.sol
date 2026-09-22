// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";
import {OracleMath} from "./OracleMath.sol";
import {MAX_BASKET_ASSETS, NARRATIVE_MAX_BYTES, NOTE_MAX_BYTES} from "./ProtocolLimits.sol";

/// @title ThesisChallenge
/// @notice An immutable capital-backed thesis with capped challenges and relative settlement.
/// @dev The factory supplies canonical collateral, approved feeds, and deployment timings.
contract ThesisChallenge is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State {
        OPEN,
        LOCKED,
        SETTLED,
        CANCELLED
    }

    struct BasketAsset {
        address feed;
        uint16 weightBps;
    }

    struct ThesisParams {
        string narrative;
        BasketAsset[] basket;
        address referenceFeed;
        uint64 challengeEndsAt;
        uint64 resolvesAt;
        uint64 settlementWindow;
        uint256 maxStartAge;
        uint256 payoutRangeBps;
        address collateral;
    }

    address public immutable creator;
    IERC20 public immutable collateral;
    string public narrative;
    address public immutable referenceFeed;
    uint64 public immutable challengeEndsAt;
    uint64 public immutable resolvesAt;
    uint64 public immutable settlementWindow;

    /// Alpha that maps to a full Challenge Pool transfer. A narrower range moves
    /// more money per unit of Alpha, so the creator picks their own leverage.
    uint256 public immutable payoutRangeBps;

    uint256 public creatorBond;
    uint256 public challengePool;
    int256 public realizedAlphaBps;
    uint64 public settledAt;
    uint256 public totalClaimed;

    mapping(address => uint256) public challengerStake;
    mapping(address => bool) public claimed;

    State private _state;
    uint256[] private _startPrices;
    BasketAsset[] private _basket;
    uint256 private _creatorPayout;
    uint256 private _challengePayoutPool;

    error InvalidParams(string reason);
    error InvalidState();
    error ChallengeWindowClosed();
    error ChallengeAmountTooLarge();
    error InvalidNote();
    error CreatorCannotChallenge();
    error TooEarly();
    error UnsafeSettlement();
    error SettlementWindowPassed();
    error NothingToClaim();
    error AlreadyClaimed();

    event ThesisCreated(
        address indexed thesis,
        address indexed creator,
        string narrative,
        address referenceFeed,
        uint256 creatorBond,
        uint64 challengeEndsAt,
        uint64 resolvesAt,
        uint256 payoutRangeBps
    );
    event ConvictionRaised(
        address indexed creator, uint256 amount, string note, uint256 creatorBond, uint256 openBounty
    );
    event ChallengePosted(
        address indexed challenger, uint256 amount, string note, uint256 challengePool, uint256 openBounty
    );
    event ThesisSettled(
        int256 realizedAlphaBps,
        uint256 transferAmount,
        uint256 creatorPayout,
        uint256 challengePayoutPool,
        uint64 settledAt
    );
    event ThesisCancelled(uint64 cancelledAt);
    event Claimed(address indexed claimant, uint256 amount);

    constructor(ThesisParams memory params, address creator_, uint256 creatorBond_) {
        if (creator_ == address(0)) revert InvalidParams("zero creator");
        if (creatorBond_ == 0) revert InvalidParams("zero bond");
        if (params.collateral == address(0)) revert InvalidParams("zero collateral");
        if (bytes(params.narrative).length == 0 || bytes(params.narrative).length > NARRATIVE_MAX_BYTES) {
            revert InvalidParams("invalid narrative");
        }
        if (params.basket.length == 0 || params.basket.length > MAX_BASKET_ASSETS) {
            revert InvalidParams("invalid basket length");
        }
        if (params.referenceFeed == address(0)) revert InvalidParams("zero reference");
        if (params.challengeEndsAt <= block.timestamp) revert InvalidParams("challenge window");
        if (params.resolvesAt <= params.challengeEndsAt) revert InvalidParams("horizon");
        if (params.settlementWindow == 0 || params.maxStartAge == 0) {
            revert InvalidParams("invalid oracle windows");
        }
        if (params.payoutRangeBps == 0) revert InvalidParams("zero payout range");

        creator = creator_;
        collateral = IERC20(params.collateral);
        narrative = params.narrative;
        referenceFeed = params.referenceFeed;
        challengeEndsAt = params.challengeEndsAt;
        resolvesAt = params.resolvesAt;
        settlementWindow = params.settlementWindow;
        payoutRangeBps = params.payoutRangeBps;
        creatorBond = creatorBond_;
        _state = State.OPEN;

        uint256 weightTotal;
        for (uint256 i = 0; i < params.basket.length; i++) {
            BasketAsset memory asset = params.basket[i];
            if (asset.feed == address(0) || asset.weightBps == 0) {
                revert InvalidParams("invalid basket asset");
            }
            if (asset.feed == params.referenceFeed) revert InvalidParams("reference in basket");
            for (uint256 j = 0; j < i; j++) {
                if (_basket[j].feed == asset.feed) revert InvalidParams("duplicate basket feed");
            }
            _basket.push(asset);
            weightTotal += asset.weightBps;
            (uint256 startPrice,) = OracleMath.latestPrice(AggregatorV3Interface(asset.feed), params.maxStartAge);
            _startPrices.push(startPrice);
        }
        if (weightTotal != 10_000) revert InvalidParams("weights");

        (uint256 referenceStartPrice,) =
            OracleMath.latestPrice(AggregatorV3Interface(params.referenceFeed), params.maxStartAge);
        _startPrices.push(referenceStartPrice);

        emit ThesisCreated(
            address(this),
            creator_,
            params.narrative,
            params.referenceFeed,
            creatorBond_,
            params.challengeEndsAt,
            params.resolvesAt,
            params.payoutRangeBps
        );
    }

    function state() public view returns (State) {
        if (_state == State.OPEN && block.timestamp >= challengeEndsAt) return State.LOCKED;
        return _state;
    }

    function openBounty() public view returns (uint256) {
        return creatorBond - challengePool;
    }

    function matchedConviction() external view returns (uint256) {
        return challengePool < creatorBond ? challengePool : creatorBond;
    }

    function creatorPayout() external view returns (uint256) {
        return _creatorPayout;
    }

    function challengePayoutPool() external view returns (uint256) {
        return _challengePayoutPool;
    }

    function challengerPayout(address challenger) public view returns (uint256) {
        if (_state == State.CANCELLED) return challengerStake[challenger];
        if (_state != State.SETTLED || challengePool == 0) return 0;
        return (challengerStake[challenger] * _challengePayoutPool) / challengePool;
    }

    function basketLength() external view returns (uint256) {
        return _basket.length;
    }

    function basketAsset(uint256 index) external view returns (address feed, uint16 weightBps) {
        BasketAsset memory asset = _basket[index];
        return (asset.feed, asset.weightBps);
    }

    function startPrices(uint256 index) external view returns (uint256) {
        return _startPrices[index];
    }

    function raiseConviction(uint256 amount, string calldata note) external nonReentrant {
        if (_state != State.OPEN || block.timestamp >= challengeEndsAt) revert ChallengeWindowClosed();
        if (msg.sender != creator) revert InvalidState();
        if (amount == 0) revert InvalidParams("zero amount");
        _validateNote(note, true);
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        creatorBond += amount;
        emit ConvictionRaised(msg.sender, amount, note, creatorBond, openBounty());
    }

    function challenge(uint256 amount, string calldata note) external nonReentrant {
        if (_state != State.OPEN || block.timestamp >= challengeEndsAt) revert ChallengeWindowClosed();
        if (msg.sender == creator) revert CreatorCannotChallenge();
        if (amount == 0) revert InvalidParams("zero amount");
        _validateNote(note, false);
        if (amount > openBounty()) revert ChallengeAmountTooLarge();
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        challengePool += amount;
        challengerStake[msg.sender] += amount;
        emit ChallengePosted(msg.sender, amount, note, challengePool, openBounty());
    }

    function settle() public nonReentrant {
        if (_state == State.SETTLED || _state == State.CANCELLED) revert InvalidState();
        _lockIfNeeded();
        if (block.timestamp < resolvesAt) revert TooEarly();

        uint256 deadline = uint256(resolvesAt) + settlementWindow;
        if (block.timestamp > deadline) {
            _cancel();
            return;
        }

        uint256[] memory endPrices = new uint256[](_basket.length + 1);
        for (uint256 i = 0; i < endPrices.length; i++) {
            (bool valid, uint256 price) =
                _tryBoundedPrice(i == _basket.length ? referenceFeed : _basket[i].feed, resolvesAt, deadline);
            if (!valid) revert UnsafeSettlement();
            endPrices[i] = price;
        }

        int256 weightedReturns;
        for (uint256 i = 0; i < _basket.length; i++) {
            int256 assetReturn = OracleMath.returnBps(_startPrices[i], endPrices[i]);
            weightedReturns += assetReturn * int256(uint256(_basket[i].weightBps));
        }
        int256 basketReturn = weightedReturns / 10_000;
        int256 referenceReturn = OracleMath.returnBps(_startPrices[_basket.length], endPrices[_basket.length]);
        realizedAlphaBps = basketReturn - referenceReturn;

        uint256 bounded = _abs(realizedAlphaBps);
        if (bounded > payoutRangeBps) bounded = payoutRangeBps;
        uint256 transferAmount = challengePool == 0 ? 0 : (challengePool * bounded) / payoutRangeBps;

        if (realizedAlphaBps > 0) {
            _creatorPayout = creatorBond + transferAmount;
            _challengePayoutPool = challengePool - transferAmount;
        } else if (realizedAlphaBps < 0) {
            _creatorPayout = creatorBond - transferAmount;
            _challengePayoutPool = challengePool + transferAmount;
        } else {
            _creatorPayout = creatorBond;
            _challengePayoutPool = challengePool;
        }

        _state = State.SETTLED;
        settledAt = uint64(block.timestamp);
        emit ThesisSettled(realizedAlphaBps, transferAmount, _creatorPayout, _challengePayoutPool, settledAt);
    }

    function resolve() external {
        settle();
    }

    function cancel() external nonReentrant {
        if (_state == State.SETTLED || _state == State.CANCELLED) revert InvalidState();
        _lockIfNeeded();
        if (block.timestamp <= uint256(resolvesAt) + settlementWindow) {
            revert SettlementWindowPassed();
        }
        _cancel();
    }

    function claim() external nonReentrant returns (uint256 amount) {
        if (_state != State.SETTLED && _state != State.CANCELLED) revert InvalidState();
        if (claimed[msg.sender]) revert AlreadyClaimed();

        if (msg.sender == creator) {
            amount = _creatorPayout;
        } else {
            if (challengerStake[msg.sender] == 0) revert NothingToClaim();
            amount = challengerPayout(msg.sender);
        }
        claimed[msg.sender] = true;
        totalClaimed += amount;
        collateral.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    function _cancel() private {
        _state = State.CANCELLED;
        realizedAlphaBps = 0;
        _creatorPayout = creatorBond;
        _challengePayoutPool = challengePool;
        settledAt = uint64(block.timestamp);
        emit ThesisCancelled(settledAt);
    }

    function _lockIfNeeded() private {
        if (_state == State.OPEN && block.timestamp >= challengeEndsAt) _state = State.LOCKED;
    }

    function _validateNote(string calldata note, bool optional) private pure {
        uint256 length = bytes(note).length;
        if ((!optional && length == 0) || length > NOTE_MAX_BYTES) revert InvalidNote();
    }

    function _tryBoundedPrice(address feed, uint256 minUpdatedAt, uint256 maxUpdatedAt)
        private
        view
        returns (bool valid, uint256 price)
    {
        try AggregatorV3Interface(feed).latestRoundData() returns (
            uint80, int256 answer, uint256, uint256 updatedAt, uint80
        ) {
            if (answer <= 0 || updatedAt < minUpdatedAt || updatedAt > maxUpdatedAt || updatedAt > block.timestamp) {
                return (false, 0);
            }
            try AggregatorV3Interface(feed).decimals() returns (uint8 decimals) {
                if (decimals > 36) return (false, 0);
                price = OracleMath.normalizePrice(answer, decimals);
                return (price > 0, price);
            } catch {
                return (false, 0);
            }
        } catch {
            return (false, 0);
        }
    }

    function _abs(int256 value) private pure returns (uint256) {
        return uint256(value >= 0 ? value : -value);
    }
}
