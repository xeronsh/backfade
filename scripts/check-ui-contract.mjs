#!/usr/bin/env node
/**
 * UI contract gate. The Design System is an architecture constraint, not a
 * document: routes compose primitives, they do not design UI.
 *
 * Rules (errors fail the gate, warnings print and pass):
 *  E1 routes/ must not use raw interactive elements — use components/ui.
 *  E2 routes/ must not import @base-ui/* — only components/ui may.
 *  E3 no raw color literals anywhere in src (tokens live in globals.css).
 *  E4 no inline motion magic numbers — import from lib/motion.ts.
 *  E5 no raw color literals outside globals.css (tokens own colour).
 *  E6 no off-scale type sizes — only the four documented roles.
 *  E7 no hardcoded CSS durations outside globals.css / motion.ts.
 *  E8 no icon libraries in pages — the product is typographic, not icon-led.
 *  W1 routes arbitrary Tailwind values are reported for review.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "web", "src");
// Optional argv[1] lets tests point the gate at a fixture tree.
const root = process.argv[2] ? resolve(process.argv[2]) : defaultRoot;
const TOKENS_FILE = join(root, "styles", "globals.css");
const MOTION_FILE = join(root, "lib", "motion.ts");

const RAW_INTERACTIVE = /<(button|input|textarea|select|details|summary)\b/;
const RAW_SVG = /<svg\b/;
const BASE_UI_IMPORT = /from\s+["']@base-ui\/react/;
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const INLINE_MOTION =
  /duration:\s*0?\.\d+|\bease:\s*\[\s*[-\d.]+\s*,|\bdelay[=:]\s*\{?\s*0?\.\d+/;

// The Design System documents exactly four type roles. Any other Tailwind
// size utility (or an arbitrary text-[...]) is drift.
const ALLOWED_TEXT_UTILITIES = new Set([
  "text-page-title",
  "text-narrative",
  "text-body",
  "text-meta",
]);
const TEXT_UTILITY = /\btext-(xs|sm|base|lg|xl|[2-9]xl|\[[^\]]+\])(?![\w-])/g;

// Durations belong to the token table, so a literal inside a className or a
// CSS declaration is a second source of truth.
const HARDCODED_DURATION =
  /duration-\[[^\]]+\]|transition-duration:\s*[0-9.]+m?s\b|(?:^|[\s"'])duration-\d{2,}/;
const ARBITRARY_TAILWIND = /\[[^\]"\s]+\]/;

// The interface is typographic. Icons are not a substitute for words, and a
// brand mark is a wordmark rather than a glyph, so no page ships an icon set.
const ICON_IMPORT = /from\s+["'](lucide-react|@radix-ui\/react-icons|react-icons)["']/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    // Test files hold deliberate counter-examples; the gate checks shipped code.
    else if (/\.(tsx?|css)$/.test(full) && !/\.test\./.test(full)) out.push(full);
  }
  return out;
}

const errors = [];
const warnings = [];
const files = walk(root);

function report(list, file, line, rule, message) {
  list.push(`${relative(root, file)}:${line}: ${rule} ${message}`);
}

for (const file of files) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const isRoute = rel.startsWith("routes/");
  const isUiPrimitive = rel.startsWith("components/ui/");
  const isTokenFile = file === TOKENS_FILE;
  const isMotionFile = file === MOTION_FILE;
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((text, index) => {
    const line = index + 1;

    if (isRoute && RAW_INTERACTIVE.test(text))
      report(
        errors,
        file,
        line,
        "E1",
        `raw ${text.match(RAW_INTERACTIVE)[1]} element; use components/ui`,
      );

    if (isRoute && RAW_SVG.test(text))
      report(errors, file, line, "E1", "raw <svg>; use lucide-react or ui/");

    if (!isUiPrimitive && BASE_UI_IMPORT.test(text))
      report(
        errors,
        file,
        line,
        "E2",
        "@base-ui/* may only be imported from components/ui",
      );

    if (!isTokenFile && !isMotionFile && RAW_COLOR.test(text))
      report(errors, file, line, "E3", "raw color literal; use a design token");

    if (!isMotionFile && !file.endsWith(".css") && INLINE_MOTION.test(text))
      report(
        errors,
        file,
        line,
        "E4",
        "inline motion value; import from lib/motion.ts",
      );

    for (const match of text.matchAll(TEXT_UTILITY)) {
      if (!ALLOWED_TEXT_UTILITIES.has(`text-${match[1]}`))
        report(
          errors,
          file,
          line,
          "E6",
          `off-scale type size ${match[0]}; use text-page-title|narrative|body|meta`,
        );
    }

    if (!isTokenFile && !isMotionFile && HARDCODED_DURATION.test(text))
      report(
        errors,
        file,
        line,
        "E7",
        "hardcoded duration; use a duration token or lib/motion.ts",
      );

    if (ICON_IMPORT.test(text))
      report(
        errors,
        file,
        line,
        "E8",
        "icon library import; this interface is typographic",
      );

    if (isRoute && ARBITRARY_TAILWIND.test(text))
      report(warnings, file, line, "W1", "arbitrary Tailwind value");
  });
}

for (const warning of warnings) console.warn(`warning ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`error ${error}`);
  console.error(
    `\nUI contract: ${errors.length} error(s) across ${files.length} files.`,
  );
  process.exit(1);
}
console.log(
  `UI contract: clean (${files.length} files, ${warnings.length} warning(s)).`,
);
