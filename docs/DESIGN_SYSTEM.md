# Design System

Backfade is **Editorial Finance × Social Market × Precision Instrument**. The interface is
restrained, legible, market-native, and accountable. It is not a casino, cyberpunk UI, or generic
shadcn demo.

## Tokens

Defined centrally in `web/src/styles/globals.css` and exposed through Tailwind v4 `@theme`.

| Role | Token | Value |
|---|---|---|
| Canvas | `--canvas` | `#090B0C` |
| Surfaces | `--surface-1/2/3` | `#0F1214` / `#15191C` / `#1B2024` |
| Borders | `--border/strong` | `#242B2F` / `#343D42` |
| Text | `--text-1/2/3` | `#F3F5F3` / `#A8B0AB` / `#707A74` |
| Brand | `--brand` | `#D4FF68` |
| BACK | `--back` / `--back-soft` | `#63D9A2` / `#12261D` |
| FADE | `--fade` / `--fade-soft` | `#FF756D` / `#2B1818` |
| Status | warning / info | `#E5C45E` / `#79BFFF` |

Neutral surfaces cover most of the screen. Brand lime is reserved for primary product actions,
focus, and active navigation. BACK and FADE colors never replace their words.

## Type and geometry

- System sans for prose; system mono for addresses, amounts, bps, percentages, and dates.
- Page title 32/38; narrative 18/25; body 15/22; metadata 12/16.
- Four-pixel spacing grid; standard values are 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- Radius: 4px data, 6px chip, 8px field, 10px button, 12px card, 14px panel, pill only when
  semantic.
- Surface cards use borders, not shadows. Shadows are limited to popovers, dialogs, and toasts.

## Component hierarchy

Generic primitives in `web/src/components/ui/` use Base UI behavior and Backfade-neutral styling:
Button, ButtonLink, Input, Textarea, Badge, Card, Alert, Collapsible, Skeleton, Separator,
Dialog, Popover, and Tooltip.

Layout primitives in `web/src/components/layout/` own page geometry: PageContainer,
PageHeader, PageSection, SplitLayout.

Data primitives in `web/src/components/data/` own information patterns: Metric, MetricGroup,
DataRow, Amount, Address, Timestamp, Figure, Status.

Domain components in `web/src/components/backfade/` own product semantics:
ThesisCard, ThesisSpec, ConvictionBar, NarrativeAlpha, PositionPanel, MarketStatus,
TransactionFlow, and WalletStatus.

## Enforcement

The rules above are checked, not merely documented. `scripts/check-ui-contract.mjs` runs first
in `make web-check` and fails the build when a route bypasses the component system:

- routes may not use raw `<button>`, `<input>`, `<textarea>`, `<select>`, `<details>`,
  `<summary>`, or `<svg>`;
- `@base-ui/react` may only be imported from `components/ui/`;
- no raw color literals outside `styles/globals.css`;
- no inline motion durations or easings outside `lib/motion.ts`.

Motion values live only in `lib/motion.ts` and the `--transition-duration-*` tokens.

## Page rules

- Feed reads as a financial-social stream, not a prediction-market grid.
- Create presents Human Narrative → Machine Financial Claim in two columns on desktop.
- Market keeps the Position Panel sticky on desktop and normal-flow on mobile.
- Profile reports chain-derived creator facts without a speculative reputation formula.
- Empty, loading, wrong-network, wallet, compiler, and transaction failures answer both “what
  happened?” and “what can I do?”.

## Accessibility and motion

All shared controls are keyboard reachable with visible focus. Labels and errors are associated
with form fields; dialogs use Base UI focus management and Escape behavior. Touch targets are at
least 44px. BACK and FADE are always named in text. Motion uses 120/160/220/280ms tokens, avoids
bounce/parallax/particles, and respects `prefers-reduced-motion`.
