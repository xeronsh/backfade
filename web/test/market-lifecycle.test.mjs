// Runnable self-check for the market state machine: `node market-lifecycle.test.mjs`
//
// Builds the module with the project's own esbuild and asserts the transition table. A wrong
// branch here shows the user a button whose only possible result is a revert.
import { build } from "esbuild";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).pathname;

await build({
  stdin: {
    contents: readFileSync(`${ROOT}src/market-lifecycle.ts`, "utf8"),
    resolveDir: `${ROOT}src`,
    loader: "ts",
  },
  format: "esm",
  bundle: true,
  outfile: "/tmp/market-lifecycle.mjs",
  logLevel: "error",
});

const { marketState, Outcome } = await import("/tmp/market-lifecycle.mjs");

const RESOLVE = 1_000_000n;
const WINDOW = 1800n;
const base = {
  outcome: Outcome.Unresolved,
  resolvesAt: RESOLVE,
  settlementWindow: WINDOW,
  bettingEndsAt: RESOLVE - 900n,
};

const at = (now, extra = {}) => marketState({ ...base, now, ...extra });

// before the entry window closes
assert.equal(at(RESOLVE - 1000n), "OPEN", "before bettingEndsAt -> OPEN");
// after betting closes, before expiry
assert.equal(at(RESOLVE - 500n), "CLOSED", "between bettingEndsAt and resolvesAt -> CLOSED");
// exactly at expiry the oracle may already serve a post-expiry print
assert.equal(at(RESOLVE), "READY", "at resolvesAt -> READY");
// inside the settlement window
assert.equal(at(RESOLVE + WINDOW), "READY", "at resolvesAt + window -> still READY");
// one second past the window resolve() is impossible
assert.equal(at(RESOLVE + WINDOW + 1n), "CANCELLABLE", "past window -> CANCELLABLE");

// settled outcomes win regardless of the clock
assert.equal(at(RESOLVE + WINDOW + 1n, { outcome: Outcome.Back }), "PROVEN");
assert.equal(at(RESOLVE + WINDOW + 1n, { outcome: Outcome.Fade }), "FAILED");
assert.equal(at(RESOLVE + WINDOW + 1n, { outcome: Outcome.Cancelled }), "CANCELLED");

// every state must be one the status pill knows how to render
const KNOWN = new Set(["OPEN", "CLOSED", "READY", "CANCELLABLE", "PROVEN", "FAILED", "CANCELLED"]);
for (const s of [at(RESOLVE - 1000n), at(RESOLVE), at(RESOLVE + WINDOW + 1n)]) {
  assert.ok(KNOWN.has(s), `unexpected state ${s}`);
}

console.log("market-lifecycle: all assertions passed");
