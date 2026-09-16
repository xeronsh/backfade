import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// vitest runs with cwd = web/, so the gate lives one directory up.
const script = resolve(process.cwd(), "../scripts/check-ui-contract.mjs");

function runGate(target?: string) {
  try {
    const stdout = execFileSync(
      process.execPath,
      target ? [script, target] : [script],
      { encoding: "utf8" },
    );
    return { code: 0, output: stdout };
  } catch (error) {
    const failure = error as { status: number; stdout: string; stderr: string };
    return {
      code: failure.status,
      output: `${failure.stdout}${failure.stderr}`,
    };
  }
}

describe("UI contract gate", () => {
  it("passes on the current source tree", () => {
    expect(runGate().code).toBe(0);
  });
  it("fails when a route uses a raw interactive element", () => {
    const fixture = mkdtempSync(join(tmpdir(), "ui-contract-"));
    mkdirSync(join(fixture, "routes"));
    writeFileSync(
      join(fixture, "routes", "Probe.tsx"),
      'export const Probe = () => <button type="button" />;\n',
    );
    const result = runGate(fixture);
    expect(result.code).toBe(1);
    expect(result.output).toContain("E1");
  });

  it("fails when a component inlines a motion magic number", () => {
    const fixture = mkdtempSync(join(tmpdir(), "ui-contract-"));
    mkdirSync(join(fixture, "components"));
    // Split so this file itself stays free of the literal the gate forbids.
    writeFileSync(
      join(fixture, "components", "Probe.tsx"),
      `export const t = { transition: { ${"duration"}: 0.243 } };\n`,
    );
    const result = runGate(fixture);
    expect(result.code).toBe(1);
    expect(result.output).toContain("E4");
  });

  it("fails when a route inlines a motion delay", () => {
    const fixture = mkdtempSync(join(tmpdir(), "ui-contract-"));
    mkdirSync(join(fixture, "routes"));
    writeFileSync(
      join(fixture, "routes", "Probe.tsx"),
      `export const P = () => <Reveal ${"delay"}={0.13} />;\n`,
    );
    const result = runGate(fixture);
    expect(result.code).toBe(1);
    expect(result.output).toContain("E4");
  });
});
