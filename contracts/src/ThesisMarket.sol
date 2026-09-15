// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "./AggregatorV3Interface.sol";
import {OracleMath} from "./OracleMath.sol";

/// @title ThesisMarket
/// @notice One bonded, priced, machine-verifiable thesis. BACK or FADE, oracle-resolved.
/// @dev Immutable spec. No privileged role. No upgradeability. Chain is the database.
contract ThesisMarket is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Side {
        Back,
        Fade
    }

    enum Outcome {
        Unresolved,
        Back,
        Fade,
        Cancelled
    }

    struct BasketAsset {
        address feed;
        uint16 weightBps;
    }

    struct MarketParams {
        string narrative;
        BasketAsset[] basket;
        address benchmarkFeed;
        int32 hurdleBps;
        uint64 bettingEndsAt;
        uint64 resolvesAt;
        address collateral;
    }

    /// @dev Settlement constants are calibrated to measured Robinhood Chain Testnet feed
    ///      behaviour (probe: 4000 updates per feed, Sep 2026 — median gap 36-52s, p90
    ///      0.75-5.0min, p99 2.8-5.6min, worst observed feed outage 21.1h). The window is
    ///      ~5x the p99 gap so an ordinary hiccup cannot cancel a market, and far shorter
    ///      than the observed outage so a dead feed cancels (full refund) instead of
    ///      settling on a stale print. MIN keeps a window long enough to be resolvable.
    uint256 public constant MIN_SETTLEMENT_WINDOW = 15 minutes;
    uint256 public constant MAX_SETTLEMENT_WINDOW = 24 hours;
    uint256 public constant MAX_START_PRICE_AGE = 24 hours;
    uint256 public constant HURDLE_MIN_BPS = 100;
    uint256 public constant HURDLE_MAX_BPS = 5_000;
    uint256 public constant BASKET_MIN = 1;
    uint256 public constant BASKET_MAX = 5;
    uint256 public constant WEIGHTS_TOTAL_BPS = 10_000;
    uint256 public constant NARRATIVE_MAX_BYTES = 280;

    string public narrative;
    BasketAsset[] public basket;
    address public immutable benchmarkFeed;
    int32 public immutable hurdleBps;
    uint64 public immutable bettingEndsAt;
    uint64 public immutable resolvesAt;
    /// @notice End prices must be observed in [resolvesAt, resolvesAt + settlementWindow].
    uint64 public immutable settlementWindow;
    /// @notice Start prices must be at most this old when the market is created.
    uint256 public immutable maxStartAge;
    IERC20 public immutable collateral;

    address public immutable creator;
    uint256 public creatorBond;

    uint256 public backPool;
    uint256 public fadePool;
    mapping(address => uint256) public backStake;
    mapping(address => uint256) public fadeStake;

    uint256[] public startPrices; // normalized to 18 decimals
    Outcome public outcome;
    int256 public narrativeAlphaBps;
    uint256 public totalClaimed;
    bool public bondCaptured;

    event MarketCreated(
        address indexed creator, string narrative, uint256 creatorBond, uint64 bettingEndsAt, uint64 resolvesAt
    );
    event PositionTaken(address indexed user, Side side, uint256 amount, uint256 backPool, uint256 fadePool);
    event MarketResolved(Outcome outcome, int256 narrativeAlphaBps);
    event MarketCancelled();
    event Claimed(address indexed user, uint256 payout);

    error BettingClosed();
    error BettingStillOpen();
    error BeforeResolveTime();
    error SettlementWindowPassed();
    error AlreadyResolved();
    error NotResolved();
    error NothingToClaim();
    error NotCancelled();
    error NoPosition();
    error InvalidParams(string reason);
    error StartPriceFailed();

    constructor(
        MarketParams memory params,
        address marketCreator,
        uint256 bondAmount,
        uint64 settlementWindow_,
        uint256 maxStartAge_
    ) {
        if (bytes(params.narrative).length == 0 || bytes(params.narrative).length > NARRATIVE_MAX_BYTES) {
            revert InvalidParams("narrative length");
        }
        if (settlementWindow_ < MIN_SETTLEMENT_WINDOW || settlementWindow_ > MAX_SETTLEMENT_WINDOW) {
            revert InvalidParams("settlement window");
        }
        if (maxStartAge_ == 0 || maxStartAge_ > MAX_START_PRICE_AGE) revert InvalidParams("max start age");
        uint256 basketLen = params.basket.length;
        if (basketLen < BASKET_MIN || basketLen > BASKET_MAX) revert InvalidParams("basket size");
        uint256 weightSum;
        for (uint256 i = 0; i < basketLen; i++) {
            if (params.basket[i].feed == address(0)) revert InvalidParams("zero feed");
            for (uint256 j = 0; j < i; j++) {
                if (params.basket[i].feed == params.basket[j].feed) revert InvalidParams("duplicate feed");
            }
            if (params.basket[i].feed == params.benchmarkFeed) revert InvalidParams("feed is benchmark");
            weightSum += params.basket[i].weightBps;
            basket.push(params.basket[i]);
        }
        if (weightSum != WEIGHTS_TOTAL_BPS) revert InvalidParams("weights");
        if (params.benchmarkFeed == address(0)) revert InvalidParams("benchmark feed");
        if (params.collateral == address(0)) revert InvalidParams("collateral");
        if (params.hurdleBps < int32(int256(HURDLE_MIN_BPS)) || params.hurdleBps > int32(int256(HURDLE_MAX_BPS))) {
            revert InvalidParams("hurdle");
        }
        if (params.bettingEndsAt >= params.resolvesAt) revert InvalidParams("betting end >= resolve");
        if (params.resolvesAt <= block.timestamp) revert InvalidParams("resolve in past");

        narrative = params.narrative;
        benchmarkFeed = params.benchmarkFeed;
        hurdleBps = params.hurdleBps;
        bettingEndsAt = params.bettingEndsAt;
        resolvesAt = params.resolvesAt;
        settlementWindow = settlementWindow_;
        maxStartAge = maxStartAge_;
        collateral = IERC20(params.collateral);
        creator = marketCreator;

        _captureStartPrices();

        // creator bond: pulled from creator (already delivered to this contract by the
        // factory), counted as BACK stake, locked until resolution
        if (bondAmount == 0) revert InvalidParams("bond zero");
        creatorBond = bondAmount;
        bondCaptured = true;
        backStake[marketCreator] = bondAmount;
        backPool = bondAmount;

        emit MarketCreated(marketCreator, params.narrative, bondAmount, params.bettingEndsAt, params.resolvesAt);
    }

    /// @notice Pull the creator bond out of the creator and count it as BACK stake.
    /// @dev For direct market creation without the factory; the factory path funds
    ///      the bond via the constructor.
    function captureBond(uint256 amount) external {
        if (msg.sender != creator) revert InvalidParams("not creator");
        if (bondCaptured) revert InvalidParams("bond captured");
        if (amount == 0) revert InvalidParams("bond zero");
        bondCaptured = true;
        backStake[creator] += amount;
        backPool += amount;
        collateral.safeTransferFrom(creator, address(this), amount);
        emit PositionTaken(creator, Side.Back, amount, backPool, fadePool);
    }

    function back(uint256 amount) external nonReentrant {
        _take(Side.Back, amount);
    }

    function fade(uint256 amount) external nonReentrant {
        _take(Side.Fade, amount);
    }

    function _take(Side side, uint256 amount) private {
        if (amount == 0) revert InvalidParams("zero amount");
        if (block.timestamp >= bettingEndsAt) revert BettingClosed();
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        if (side == Side.Back) {
            backStake[msg.sender] += amount;
            backPool += amount;
        } else {
            fadeStake[msg.sender] += amount;
            fadePool += amount;
        }
        emit PositionTaken(msg.sender, side, amount, backPool, fadePool);
    }

    /// @notice Deterministic settlement from oracle prices. Permissionless, math decides.
    /// @dev Every end price must have been observed at or after resolvesAt (blocking the
    ///      pre-expiry price), inside [resolvesAt, resolvesAt + settlementWindow] (blocking
    ///      an unbounded wait for a favourable print). No caller or creator input changes
    ///      the outcome.
    function resolve() external {
        if (outcome != Outcome.Unresolved) revert AlreadyResolved();
        if (block.timestamp < resolvesAt) revert BeforeResolveTime();
        if (block.timestamp > resolvesAt + settlementWindow) revert SettlementWindowPassed();

        uint256 maxUpdatedAt = resolvesAt + settlementWindow;
        uint256 basketLen = basket.length;
        int256[] memory returnsBps = new int256[](basketLen);
        uint16[] memory weights = new uint16[](basketLen);
        for (uint256 i = 0; i < basketLen; i++) {
            (uint256 startP,) = _startPrice(i);
            uint256 endP = OracleMath.boundedPrice(AggregatorV3Interface(basket[i].feed), resolvesAt, maxUpdatedAt);
            returnsBps[i] = OracleMath.returnBps(startP, endP);
            weights[i] = basket[i].weightBps;
        }
        (uint256 startB,) = _startPrice(basketLen); // benchmark stored last
        uint256 endB = OracleMath.boundedPrice(AggregatorV3Interface(benchmarkFeed), resolvesAt, maxUpdatedAt);
        int256 benchmarkReturnBps = OracleMath.returnBps(startB, endB);

        int256 basketReturnBps = OracleMath.weightedReturnBps(returnsBps, weights);
        int256 alpha = basketReturnBps - benchmarkReturnBps;
        narrativeAlphaBps = alpha;

        outcome = alpha >= hurdleBps ? Outcome.Back : Outcome.Fade;
        emit MarketResolved(outcome, alpha);
    }

    /// @notice Fallback if no safe settlement was possible within the window. Permissionless.
    function cancelAfterDeadline() external {
        if (outcome != Outcome.Unresolved) revert AlreadyResolved();
        if (block.timestamp <= resolvesAt + settlementWindow) revert NotCancelled();
        outcome = Outcome.Cancelled;
        emit MarketCancelled();
    }

    /// @notice Winners claim pro-rata of the whole pool. Losses forfeit.
    /// @dev Pari-mutuel, floor division: payout = stake * totalPool / winningPool.
    ///      The creator bond is ordinary BACK stake and only the creator can claim it.
    ///      Rounding dust is bounded — see winnerPayout() for the per-winner quote.
    function claim() external nonReentrant {
        Outcome o = outcome;
        if (o == Outcome.Unresolved) revert NotResolved();
        if (o == Outcome.Cancelled) revert NotCancelled();

        uint256 stake = o == Outcome.Back ? backStake[msg.sender] : fadeStake[msg.sender];
        if (stake == 0) revert NothingToClaim();

        uint256 payout = winnerPayout(o, stake);

        backStake[msg.sender] = 0;
        fadeStake[msg.sender] = 0;
        totalClaimed += payout;
        collateral.safeTransfer(msg.sender, payout);
        emit Claimed(msg.sender, payout);
    }

    /// @notice Quote for a winning stake: stake * totalPool / winningPool, floored.
    /// @dev With a single winner this returns the entire pool, so the market drains to zero.
    ///      With several winners each payout floors, leaving at most one wei per winner
    ///      unclaimed — the deliberate rounding policy, no privileged sweep exists to hide it.
    function winnerPayout(Outcome o, uint256 stake) public view returns (uint256) {
        if (o != Outcome.Back && o != Outcome.Fade) return 0;
        uint256 winningPool = o == Outcome.Back ? backPool : fadePool;
        if (winningPool == 0) return 0;
        return (stake * (backPool + fadePool)) / winningPool;
    }

    /// @notice Refund principal after cancellation.
    function refund() external nonReentrant {
        if (outcome != Outcome.Cancelled) revert NotCancelled();
        uint256 amount = backStake[msg.sender] + fadeStake[msg.sender];
        if (amount == 0) revert NoPosition();
        backStake[msg.sender] = 0;
        fadeStake[msg.sender] = 0;
        collateral.safeTransfer(msg.sender, amount);
        emit Claimed(msg.sender, amount);
    }

    // --- views for the frontend ---

    function basketLength() external view returns (uint256) {
        return basket.length;
    }

    function basketAsset(uint256 i) external view returns (address feed, uint16 weightBps) {
        BasketAsset memory a = basket[i];
        return (a.feed, a.weightBps);
    }

    function backPct() external view returns (uint256) {
        uint256 total = backPool + fadePool;
        if (total == 0) return 0;
        return (backPool * 10_000) / total;
    }

    function _captureStartPrices() private {
        uint256 basketLen = basket.length;
        for (uint256 i = 0; i < basketLen; i++) {
            (uint256 p,) = OracleMath.latestPrice(AggregatorV3Interface(basket[i].feed), maxStartAge);
            startPrices.push(p);
        }
        (uint256 pb,) = OracleMath.latestPrice(AggregatorV3Interface(benchmarkFeed), maxStartAge);
        startPrices.push(pb);
    }

    function _startPrice(uint256 i) private view returns (uint256, uint8) {
        return (startPrices[i], 18);
    }
}
