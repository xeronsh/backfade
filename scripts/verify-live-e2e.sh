#!/usr/bin/env bash
set -euo pipefail

RPC="${LIVE_RPC_URL:-https://rpc.testnet.chain.robinhood.com}"
THESIS="${LIVE_THESIS:-0x914345586A1fb1598BFB371DA5cca53614ff91C7}"
COLLATERAL="${LIVE_COLLATERAL:-0x84C5f600720532f71009dd2cBED168e766383eE8}"
FROM_BLOCK="${LIVE_FROM_BLOCK:-120693575}"
EXPECTED_CLAIMS=3
EXPECTED_TOTAL=1500000000000000000000

fail() {
  echo "live E2E verification failed: $*" >&2
  exit 1
}

[[ "$(cast code "$THESIS" --rpc-url "$RPC")" != "0x" ]] || fail "Thesis has no bytecode"
[[ "$(cast code "$COLLATERAL" --rpc-url "$RPC")" != "0x" ]] || fail "collateral has no bytecode"

state=$(cast call "$THESIS" 'state()(uint8)' --rpc-url "$RPC" | awk 'NR == 1 {print $1}')
total_claimed=$(cast call "$THESIS" 'totalClaimed()(uint256)' --rpc-url "$RPC" | awk 'NR == 1 {print $1}')
balance=$(cast call "$COLLATERAL" 'balanceOf(address)(uint256)' "$THESIS" --rpc-url "$RPC" | awk 'NR == 1 {print $1}')
[[ "$state" == "2" ]] || fail "expected SETTLED state (2), got $state"
[[ "$total_claimed" == "$EXPECTED_TOTAL" ]] || fail "expected totalClaimed=$EXPECTED_TOTAL, got $total_claimed"
[[ "$balance" == "0" ]] || fail "expected zero Thesis collateral balance, got $balance"

latest=$(cast block-number --rpc-url "$RPC")
settled_logs=$(cast logs --json \
  --address "$THESIS" \
  --from-block "$FROM_BLOCK" \
  --to-block "$latest" \
  'ThesisSettled(int256,uint256,uint256,uint256,uint64)' \
  --rpc-url "$RPC" | jq 'length')
claimed_logs=$(cast logs --json \
  --address "$THESIS" \
  --from-block "$FROM_BLOCK" \
  --to-block "$latest" \
  'Claimed(address,uint256)' \
  --rpc-url "$RPC" | jq 'length')
[[ "$settled_logs" == "1" ]] || fail "expected one ThesisSettled log, got $settled_logs"
[[ "$claimed_logs" == "$EXPECTED_CLAIMS" ]] || fail "expected $EXPECTED_CLAIMS Claimed logs, got $claimed_logs"

echo "live E2E verified: state=SETTLED ThesisSettled=$settled_logs Claimed=$claimed_logs totalClaimed=$total_claimed balance=$balance"
