// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Vm} from "forge-std/Vm.sol";
import {ThesisChallenge} from "../src/ThesisChallenge.sol";
import {MAX_PAYOUT_RANGE_BPS, MIN_PAYOUT_RANGE_BPS, NARRATIVE_MAX_BYTES} from "../src/ProtocolLimits.sol";
import {ThesisChallengeBase} from "./ThesisChallengeBase.t.sol";

/// Covers the three parameters a creator now chooses: narrative length, horizon,
/// and payout range. The payout range is the one with economic teeth — it is the
/// creator's leverage, so it gets an invariant rather than a bounds check.
contract ThesisParametersTest is ThesisChallengeBase {
    function setUp() public override {
        super.setUp();
        vm.prank(creator);
        usdg.approve(address(factory), type(uint256).max);
    }

    function _basket() internal view returns (ThesisChallenge.BasketAsset[] memory basket) {
        basket = new ThesisChallenge.BasketAsset[](2);
        basket[0] = ThesisChallenge.BasketAsset(address(assetA), 6_000);
        basket[1] = ThesisChallenge.BasketAsset(address(assetB), 4_000);
    }

    /// Callers supply the `vm.prank(creator)`: an inner prank would be consumed by
    /// `vm.expectRevert` as the call under test and mask the revert being asserted.
    function _createRaw(uint64 horizon, uint256 payoutRange, string memory narrative)
        internal
        returns (ThesisChallenge thesis)
    {
        ThesisChallenge.BasketAsset[] memory basket = _basket();
        thesis = ThesisChallenge(factory.createThesis(narrative, basket, address(refFeed), horizon, payoutRange, BOND));
    }

    function _repeat(string memory unit, uint256 times) internal pure returns (string memory) {
        bytes memory u = bytes(unit);
        bytes memory out = new bytes(u.length * times);
        for (uint256 i = 0; i < times; i++) {
            for (uint256 j = 0; j < u.length; j++) {
                out[i * u.length + j] = u[j];
            }
        }
        return string(out);
    }

    /// Settles and returns the `ThesisSettled.transferAmount`, which is the money
    /// that actually changed hands between the two sides.
    function _settleTransfer(ThesisChallenge thesis) internal returns (uint256 transfer) {
        vm.recordLogs();
        thesis.settle();
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 signature = keccak256("ThesisSettled(int256,uint256,uint256,uint256,uint64)");
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == signature) {
                (, transfer,,,) = abi.decode(logs[i].data, (int256, uint256, uint256, uint256, uint64));
            }
        }
    }

    /// Opens a thesis at the given payout range with one 600 USDG Fade, walks it
    /// to expiry, publishes a +4% Narrative Alpha, and returns the transfer.
    function _transferAtRange(uint256 payoutRange) internal returns (uint256) {
        // Start prices are captured at creation, so reset the feeds first: the
        // previous probe left them already moved and a flat second run would
        // settle at zero Alpha.
        publishPrices(200e8, 100e8, 500e8);
        vm.prank(creator);
        ThesisChallenge thesis = _createRaw(HORIZON, payoutRange, "Leverage probe.");
        approveAndChallenge(thesis, faderA, 600e18, "Fade.");
        advanceToExpiry(thesis);
        // Equal asset returns of +4% against a flat reference produce exactly 400 bps.
        publishPrices(208e8, 104e8, 500e8);
        return _settleTransfer(thesis);
    }

    function test_LongNarrativeIsAccepted() public {
        vm.prank(creator);
        ThesisChallenge thesis = _createRaw(HORIZON, PAYOUT_RANGE, _repeat("a", 1_500));
        assertEq(bytes(thesis.narrative()).length, 1_500);
    }

    function test_NarrativeAtTheLimitIsAccepted() public {
        vm.prank(creator);
        ThesisChallenge thesis = _createRaw(HORIZON, PAYOUT_RANGE, _repeat("a", NARRATIVE_MAX_BYTES));
        assertEq(bytes(thesis.narrative()).length, NARRATIVE_MAX_BYTES);
    }

    function test_NarrativeBeyondTheLimitIsRejected() public {
        vm.prank(creator);
        vm.expectRevert();
        _createRaw(HORIZON, PAYOUT_RANGE, _repeat("a", NARRATIVE_MAX_BYTES + 1));
    }

    function test_HorizonMustBeAllowlisted() public {
        vm.prank(creator);
        vm.expectRevert();
        _createRaw(3 hours, PAYOUT_RANGE, "Three hours is not in the allowlist.");
    }

    function test_PayoutRangeOutsideBoundsIsRejected() public {
        vm.prank(creator);
        vm.expectRevert();
        _createRaw(HORIZON, MIN_PAYOUT_RANGE_BPS - 1, "Below the floor.");
        vm.prank(creator);
        vm.expectRevert();
        _createRaw(HORIZON, MAX_PAYOUT_RANGE_BPS + 1, "Above the ceiling.");
    }

    /// The core economic claim: a narrower payout range is more leverage, so the
    /// same Realized Alpha moves proportionally more capital.
    function test_NarrowerPayoutRangeMovesProportionallyMoreCapital() public {
        uint256 wide = _transferAtRange(5_000);
        uint256 narrow = _transferAtRange(1_000);
        assertGt(narrow, 0);
        assertEq(narrow, wide * 5);
    }
}
