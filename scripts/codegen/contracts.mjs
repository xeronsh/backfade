import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const contracts = resolve(root, "contracts");
const output = resolve(root, "web/src/generated/contracts.ts");
const names = [
  ["src/ThesisFactory.sol", "ThesisFactory", "FACTORY_ABI"],
  ["src/ThesisChallenge.sol", "ThesisChallenge", "THESIS_ABI"],
  // v0.1 artifacts stay generated for historical deployment inspection only.
  ["src/legacy/ThesisMarket.sol", "ThesisMarket", "MARKET_ABI"],
  ["src/legacy/LegacyThesisFactory.sol", "LegacyThesisFactory", "LEGACY_FACTORY_ABI"],
  ["src/MockUSDG.sol", "MockUSDG", "ERC20_ABI"],
  ["src/AggregatorV3Interface.sol", "AggregatorV3Interface", "ORACLE_ABI"],
];

function inspect(source, contract) {
  const raw = execFileSync("forge", ["inspect", `${source}:${contract}`, "abi", "--json"], {
    cwd: contracts,
    encoding: "utf8",
  });
  return JSON.parse(raw);
}

const body = ["// AUTO-GENERATED — DO NOT EDIT.", "// Source: contracts/src/*.sol Foundry artifacts via forge inspect.", ""];
for (const [source, contract, constant] of names) {
  body.push(`export const ${constant} = ${JSON.stringify(inspect(source, contract), null, 2)} as const;`, "");
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${body.join("\n")}\n`);
console.log(`Generated ${output}`);
