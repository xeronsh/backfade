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

rpc() {
  local attempt output=""
  for attempt in {1..5}; do
    if output=$(cast "$@" --rpc-url "$RPC" 2>&1); then
      printf '%s\n' "$output"
      return 0
    fi
    sleep 2
  done
  printf '%s\n' "$output" >&2
  return 1
}

[[ "$(rpc code "$THESIS")" != "0x" ]] || fail "Thesis has no bytecode"
[[ "$(rpc code "$COLLATERAL")" != "0x" ]] || fail "collateral has no bytecode"

state=$(rpc call "$THESIS" 'state()(uint8)' | awk 'NR == 1 {print $1}')
total_claimed=$(rpc call "$THESIS" 'totalClaimed()(uint256)' | awk 'NR == 1 {print $1}')
balance=$(rpc call "$COLLATERAL" 'balanceOf(address)(uint256)' "$THESIS" | awk 'NR == 1 {print $1}')
[[ "$state" == "2" ]] || fail "expected SETTLED state (2), got $state"
[[ "$total_claimed" == "$EXPECTED_TOTAL" ]] || fail "expected totalClaimed=$EXPECTED_TOTAL, got $total_claimed"
[[ "$balance" == "0" ]] || fail "expected zero Thesis collateral balance, got $balance"

latest=$(rpc block-number)
settled_logs=$(rpc logs --json \
  --address "$THESIS" \
  --from-block "$FROM_BLOCK" \
  --to-block "$latest" \
  'ThesisSettled(int256,uint256,uint256,uint256,uint64)' | jq 'length')
claimed_logs=$(rpc logs --json \
  --address "$THESIS" \
  --from-block "$FROM_BLOCK" \
  --to-block "$latest" \
  'Claimed(address,uint256)' | jq 'length')
[[ "$settled_logs" == "1" ]] || fail "expected one ThesisSettled log, got $settled_logs"
[[ "$claimed_logs" == "$EXPECTED_CLAIMS" ]] || fail "expected $EXPECTED_CLAIMS Claimed logs, got $claimed_logs"

echo "live E2E verified: state=SETTLED ThesisSettled=$settled_logs Claimed=$claimed_logs totalClaimed=$total_claimed balance=$balance"
