#!/usr/bin/env python3
"""Check that generated web ABIs match the v0.2 and preserved v0.1 contracts."""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTRACTS = ROOT / "contracts"
WEB_ABI = ROOT / "web/src/generated/contracts.ts"


def artifact_abi(source: str, contract: str):
    out = subprocess.run(
        ["forge", "inspect", f"{source}:{contract}", "abi", "--json"],
        cwd=CONTRACTS,
        capture_output=True,
        text=True,
    )
    if out.returncode != 0:
        sys.exit(f"forge inspect failed for {contract}: {out.stderr.strip()}")
    return json.loads(out.stdout)


def web_signatures(src: str, const_name: str):
    match = re.search(rf"export const {const_name} = \[(.*?)\n\] as const;", src, re.S)
    if not match:
        sys.exit(f"could not locate {const_name} in {WEB_ABI}")
    body = match.group(1)
    names, depth, entry = set(), 0, ""
    for char in body:
        if char == "{" and depth == 0:
            depth, entry = 1, "{"
            continue
        if depth:
            entry += char
            depth += char == "{"
            depth -= char == "}"
            if depth == 0:
                entry_type = re.search(r'"?type"?\s*:\s*"(function|event)"', entry)
                name = re.search(r'"?name"?\s*:\s*"(\w+)"', entry)
                if entry_type and name:
                    names.add(name.group(1))
    return names


TARGETS = [
    (
        "src/ThesisChallenge.sol",
        "ThesisChallenge",
        "THESIS_ABI",
        {
            "narrative",
            "creator",
            "collateral",
            "creatorBond",
            "challengePool",
            "openBounty",
            "matchedConviction",
            "challengeEndsAt",
            "resolvesAt",
            "settlementWindow",
            "referenceFeed",
            "basketLength",
            "basketAsset",
            "startPrices",
            "state",
            "realizedAlphaBps",
            "settledAt",
            "creatorPayout",
            "challengePayoutPool",
            "challengerStake",
            "challengerPayout",
            "totalClaimed",
            "claimed",
            "challenge",
            "raiseConviction",
            "settle",
            "resolve",
            "cancel",
            "claim",
            "ThesisCreated",
            "ConvictionRaised",
            "ChallengePosted",
            "ThesisSettled",
            "ThesisCancelled",
            "Claimed",
        },
    ),
    (
        "src/ThesisFactory.sol",
        "ThesisFactory",
        "FACTORY_ABI",
        {
            "canonicalCollateral",
            "allowedFeed",
            "allowedFeeds",
            "allowedFeedsLength",
            "theses",
            "thesesLength",
            "thesisAt",
            "isThesis",
            "createThesis",
            "ThesisCreated",
        },
    ),
    ("src/legacy/ThesisMarket.sol", "ThesisMarket", "MARKET_ABI", set()),
    ("src/legacy/LegacyThesisFactory.sol", "LegacyThesisFactory", "LEGACY_FACTORY_ABI", set()),
]


def main():
    src = WEB_ABI.read_text()
    failures = []
    for source, contract, const, required in TARGETS:
        onchain = {
            entry["name"]
            for entry in artifact_abi(source, contract)
            if entry["type"] in ("function", "event")
        }
        declared = web_signatures(src, const)
        for name in sorted(required - onchain):
            failures.append(f"{const}.{name}: required but absent onchain")
        for name in sorted(required - declared):
            failures.append(f"{const}.{name}: required but missing from generated ABI")
        for name in sorted(declared - onchain):
            failures.append(f"{const}.{name}: declared but absent onchain")
        print(f"{const}: {len(declared)} declared / {len(onchain)} onchain")

    if failures:
        print("\nABI DRIFT DETECTED:")
        for failure in failures:
            print(f"  - {failure}")
        sys.exit(1)
    print("ABI PARITY OK")


if __name__ == "__main__":
    main()
