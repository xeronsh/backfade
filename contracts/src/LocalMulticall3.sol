// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal aggregate3 implementation for the local browser E2E chain.
contract LocalMulticall3 {
    struct Call3 {
        address target;
        bool allowFailure;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory results) {
        results = new Result[](calls.length);
        for (uint256 i; i < calls.length; ++i) {
            (bool success, bytes memory returnData) = calls[i].target.call(calls[i].callData);
            if (!success && !calls[i].allowFailure) {
                assembly ("memory-safe") {
                    revert(add(returnData, 0x20), mload(returnData))
                }
            }
            results[i] = Result({success: success, returnData: returnData});
        }
    }
}
