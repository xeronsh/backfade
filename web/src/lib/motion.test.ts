import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { collapse, cssDuration, duration, ease } from "@/lib/motion";

/**
 * The goal's thesis is "one source of truth, enforced". Motion lives in two
 * places for a real reason — JS values for Motion, CSS custom properties for
 * Tailwind utilities — so this test is what keeps them from drifting apart.
 */
describe("motion single source of truth", () => {
  const css = readFileSync(
    resolve(process.cwd(), "src/styles/globals.css"),
    "utf8",
  );

  it("keeps the CSS duration tokens equal to the JS duration tokens", () => {
    expect(cssDuration).toEqual({
      fast: "120ms",
      standard: "160ms",
      slow: "220ms",
      emphasis: "280ms",
    });
    // Both tables are ordered smallest to largest and cover the same four steps.
    expect(Object.values(duration)).toEqual([0.12, 0.16, 0.22, 0.28]);
    const ms = Object.values(cssDuration).map((value) =>
      Number.parseFloat(value),
    );
    expect(ms).toEqual(Object.values(duration).map((value) => value * 1000));
  });

  it("declares every CSS duration token with the value cssDuration states", () => {
    for (const [name, value] of Object.entries(cssDuration)) {
      expect(css).toContain(`--transition-duration-${name}: ${value};`);
    }
  });

  it("declares no CSS duration token that motion.ts does not know about", () => {
    const declared = [...css.matchAll(/--transition-duration-([a-z-]+):/g)].map(
      (match) => match[1],
    );
    // `none` is the reduced-motion collapse, deliberately not a motion step.
    const extra = declared.filter(
      (name) => name !== "none" && !(name in cssDuration),
    );
    expect(extra).toEqual([]);
  });

  it("keeps CSS easing tokens equal to the JS easing tuples", () => {
    for (const [name, curve] of Object.entries(ease)) {
      expect(css).toContain(
        `--ease-${name}: cubic-bezier(${curve.join(", ")});`,
      );
    }
  });

  it("exposes the collapse variants the objective requires", () => {
    expect(collapse).toHaveProperty("open");
    expect(collapse).toHaveProperty("closed");
  });
});
