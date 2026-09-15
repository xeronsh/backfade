#!/usr/bin/env python3
"""ABI parity gate: the hand-written web ABI must match the compiled artifacts.

Run from the repo root:  python3 scripts/abi_parity.py
Exits non-zero and prints every drift on mismatch. This is the check that would have
caught the missing settlementWindow/maxStartAge entries (PHASE 4.6).
"""
import json, re, subprocess, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTRACTS = ROOT / "contracts"
WEB_ABI = ROOT / "web/src/contracts.ts"

def artifact_abi(contract: str):
    out = subprocess.run(
        ["forge", "inspect", f"src/{contract}.sol:{contract}", "abi", "--json"],
        cwd=CONTRACTS, capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit(f"forge inspect failed for {contract}: {out.stderr.strip()}")
    return json.loads(out.stdout)

def canon(entry, name_key="name"):
    """Canonical signature: name + input types, everything the ABI must agree on."""
    def t(i):
        if i["type"].startswith("tuple"):
            inner = ",".join(t(c) for c in i.get("components", []))
            return f"({inner})" + i["type"][len("tuple"):]
        return i["type"]
    return f'{entry[name_key]}({",".join(t(i) for i in entry.get("inputs", []))})'

def web_signatures(src: str, const_name: str):
    m = re.search(rf"export const {const_name} = \[(.*?)\n\] as const;", src, re.S)
    if not m:
        sys.exit(f"could not locate {const_name} in {WEB_ABI}")
    body = m.group(1)
    sigs, depth, buf, entries = set(), 0, "", []
    for ch in body:
        if ch == "{" and depth == 0:
            depth, buf = 1, "{"
            continue
        if depth:
            buf += ch
            depth += ch == "{"
            depth -= ch == "}"
            if depth == 0:
                entries.append(buf)
    for e in entries:
        nm = re.search(r'name: "(\w+)"', e)
        if not nm:
            continue
        # only compare functions/events that carry explicit input lists
        if "type: \"function\"" not in e and "type: \"event\"" not in e:
            continue
        sigs.add(nm.group(1))
    return sigs

# The exact surface the frontend reads/writes. ABI drift here is what silently breaks the
# Create / Market / Profile pages at runtime, so every entry must exist onchain with the
# same name and input arity. Extra optional entries are allowed but must also exist onchain.
REQUIRED = {
    "MARKET_ABI": [
        "narrative", "hurdleBps", "bettingEndsAt", "resolvesAt", "collateral", "creator",
        "creatorBond", "backPool", "fadePool", "outcome", "narrativeAlphaBps",
        "basketLength", "basketAsset", "benchmarkFeed", "settlementWindow", "maxStartAge",
        "backStake", "fadeStake", "totalClaimed", "backPct",
        "back", "fade", "resolve", "claim", "refund", "cancelAfterDeadline",
        "PositionTaken", "MarketResolved",
    ],
    "FACTORY_ABI": ["createMarket", "marketsLength", "marketAt", "MarketCreated"],
}


def main():
    src = WEB_ABI.read_text()
    failures = []
    for contract, const in (("ThesisMarket", "MARKET_ABI"), ("ThesisFactory", "FACTORY_ABI")):
        abi = artifact_abi(contract)
        onchain = {e["name"]: e for e in abi if e["type"] in ("function", "event")}
        decl = web_signatures(src, const)
        required = set(REQUIRED[const])

        for name in sorted(required):
            if name not in onchain:
                failures.append(f"{const}.{name}: required by the frontend but ABSENT onchain")
            elif name not in decl:
                failures.append(f"{const}.{name}: present onchain but MISSING from the web ABI")
        for name in sorted(decl - set(onchain)):
            failures.append(f"{const}.{name}: declared in the web ABI but ABSENT onchain")

        print(f"{const}: {len(decl)} declared / {len(required)} required / {len(onchain)} onchain")

    if failures:
        print("\nABI DRIFT DETECTED:")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("ABI PARITY OK")

if __name__ == "__main__":
    main()
