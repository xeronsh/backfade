# Design System

Backfade is editorial finance applied to a social feed: dark, precise, restrained, square, and readable. It is not casino UI, a market dashboard, or a generic AI product.

## Visual language

- Neutral canvas and bordered surfaces carry most of the screen.
- Lime brand color marks primary actions and active navigation.
- Green/red tones communicate capital direction but never replace words.
- System sans handles prose; system mono handles addresses, amounts, percentages, bps, and dates.
- Four type roles are allowed: `text-page-title`, `text-narrative`, `text-body`, `text-meta`.
- Cards use borders rather than shadows. Route-level geometry comes from layout primitives.

## Component hierarchy

- `components/ui/`: Button, ButtonLink, Input, Textarea, Badge, Card, Alert, and other generic controls.
- `components/layout/`: PageContainer, PageHeader, PageSection, SplitLayout.
- `components/data/`: Metric, MetricGroup, DataRow, Address, Amount, Timestamp, Figure, and Status.
- `components/backfade/`: ThesisPost, ThesisSpec, ChallengeComposer, TransactionFlow, NarrativeAlpha, and WalletStatus.

Routes compose these primitives instead of creating one-off interactive markup. All controls have visible focus, labels, keyboard access, and touch targets of at least 44px. User-generated Challenge notes render as plain text; no raw HTML or executable Markdown is interpreted.

## Pages

- **Home:** one-column Thesis feed with Creator Conviction, Matched Conviction, Open Bounty, Alpha, Challenge count, and `Fade it`.
- **Post:** write the narrative first, preview the compiler structure, explicitly confirm the Reference, enter Conviction, then Bond & Post.
- **Thread:** original Thesis, Live/Realized Alpha, Challenges, capital tape, settlement, and Fade composer.
- **Profile:** realized P&L, matched capital, resolved count, matched-weighted Creator Alpha, Fade P&L, and losing history.
- **Leaderboard:** Overall, Creators, and Faders sorted by realized net P&L with matched capital, resolved count, and counterparties. It provides discovery, not identity proof or rewards.

Mobile becomes a single column. Desktop uses a restrained two-column thread/post layout; there is no casino grid, odds panel, probability chart, or binary outcome split.

## Motion and enforcement

Motion is optional and respects `prefers-reduced-motion`. Values live in `web/src/lib/motion.ts` and CSS tokens. `scripts/check-ui-contract.mjs` rejects raw route controls, raw colors, inline timing values, off-scale text sizes, hard navigation, and icon-library imports.
