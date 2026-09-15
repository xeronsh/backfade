import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const contracts = resolve(root, "contracts");
const output = resolve(root, "web/src/generated/contracts.ts");
const names = [
  ["ThesisFactory", "FACTORY_ABI"],
  ["ThesisMarket", "MARKET_ABI"],
  ["MockUSDG", "ERC20_ABI"],
  ["AggregatorV3Interface", "ORACLE_ABI"],
];

function inspect(contract) {
  const raw = execFileSync("forge", ["inspect", `src/${contract}.sol:${contract}`, "abi", "--json"], {
    cwd: contracts,
    encoding: "utf8",
  });
  return JSON.parse(raw);
}

const body = ["// AUTO-GENERATED — DO NOT EDIT.", "// Source: contracts/src/*.sol Foundry artifacts via forge inspect.", ""];
for (const [contract, constant] of names) {
  body.push(`export const ${constant} = ${JSON.stringify(inspect(contract), null, 2)} as const;`, "");
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${body.join("\n")}\n`);
console.log(`Generated ${output}`);
