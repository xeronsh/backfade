# Backfade — Product / Design / Engineering GOAL

> Domain: **backfade.fun**  
> Working product name: **Backfade**  
> Hackathon: **Arbitrum Open House Singapore — Online Buildathon**  
> Primary chain: **Robinhood Chain Testnet**  
> Status: **v0.1 implementation spec**  
> Principle: **KISS first. Ship a complete loop before adding narrative layers.**

---

## 0. Executive Summary

**Backfade is a social market for investment narratives.**

People already publish market takes on X, Reddit, Telegram and Discord, but those takes are cheap to make, hard to compare, easy to delete, and rarely tied to a verifiable track record.

Backfade turns a market narrative into a **bonded, priced, machine-verifiable thesis**.

The full loop is:

```text
POST
  ↓
COMPILE
  ↓
BOND
  ↓
BACK / FADE
  ↓
RESOLVE
  ↓
PROVE
  ↓
REPUTATION
```

The core innovation is not "AI prediction market".

The core innovation is:

> **Narrative Alpha** — a market narrative becomes a benchmarked financial claim whose alpha can be objectively measured and settled onchain.

Example:

```text
Human narrative:
"AI is rotating into nuclear."

            ↓ Thesis Compiler

Basket:
CEG 40%
VST 35%
GEV 25%

Benchmark:
NVDA

Hurdle:
+10% excess return

Window:
30 days

            ↓

Creator bonds capital

            ↓

Others BACK or FADE

            ↓

Robinhood Chain price oracles settle the thesis

            ↓

The creator earns or loses capital
and permanently builds an onchain track record
```

---

# 1. Purpose, Mission, Goal

## 1.1 Purpose

> **Make market opinions accountable.**

Backfade exists because most market opinions today have three weaknesses:

1. They are unstructured.
2. They have no skin in the game.
3. They do not produce a durable, comparable reputation.

Backfade turns opinions into financial objects that can be priced and resolved.

## 1.2 Mission

> **Turn narratives into bonded, priced and verifiable financial claims.**

## 1.3 Long-term Goal

> **Become the reputation and price-discovery layer for market opinions.**

Long term, a thesis may be created by:

- a human trader;
- an analyst;
- an influencer;
- an AI agent;
- a research DAO;
- a fund.

All creators compete on the same thing:

> **Did the thesis generate alpha, how early was it, and how much capital did the creator risk?**

## 1.4 Product Category

Do **not** position Backfade as:

- an AI chatbot;
- an AI stock research app;
- a Polymarket clone;
- a memecoin launchpad;
- an index builder;
- a generic SocialFi app.

Preferred category language:

> **A social market for investment narratives.**

Protocol language:

> **A narrative market protocol.**

Technical primitive:

> **Narrative Alpha + Proof of Conviction.**

## 1.5 Core Brand Statement

Primary:

> **Back the thesis. Fade the noise.**

Secondary:

> **Trade the narrative, not just the ticker.**

Product explanation:

> **Turn market takes into bonded, priced, verifiable theses.**

---

# 2. Non-Negotiable Product Principles

These rules override feature requests.

## 2.1 One Product Object

There is only one first-class product object:

```text
Thesis
```

Do not create parallel models named:

- Post;
- Prediction;
- Call;
- Signal;
- Strategy;
- Bet;
- Market.

A thesis contains both the social expression and financial contract.

## 2.2 AI Is a Compiler, Not an Oracle

AI may:

- understand a natural-language narrative;
- propose assets;
- propose weights;
- propose benchmark;
- propose hurdle;
- propose expiry;
- explain the structure;
- flag ambiguity;
- generate a short rationale.

AI must **never**:

- decide who won;
- manually resolve a market;
- override oracle data;
- invent a settlement result;
- directly custody user funds.

Settlement must be deterministic.

## 2.3 Chain Stores Financial Truth

Onchain:

- thesis financial specification;
- creator;
- creator bond;
- BACK/FADE positions;
- oracle start state;
- oracle settlement;
- final outcome;
- claims;
- events needed to reconstruct track record.

Offchain:

- AI compilation;
- explanation;
- temporary UI state;
- Robinhood metadata used only for safety hints;
- analytics derived from chain events.

## 2.4 No Database in v0.1

No:

- PostgreSQL;
- SQLite;
- MongoDB;
- Redis;
- Supabase;
- Firebase;
- custom indexer.

For v0.1:

> **The chain is the database and contract events are the index.**

If later query volume becomes a real problem, add an indexer.

## 2.5 Complete Loop > Feature Count

The demo must complete this exact lifecycle:

```text
natural language
→ structured thesis
→ creator bond
→ market creation
→ BACK/FADE
→ oracle settlement
→ claim
→ creator history update
```

A missing step in this loop is more serious than ten missing secondary features.

---

# 3. v0.1 Scope

## 3.1 Must Ship

### Thesis creation

- natural-language input;
- AI compilation;
- deterministic validation;
- human confirmation;
- creator bond;
- onchain market creation.

### Financial expression

Support exactly one thesis type:

```text
WEIGHTED_BASKET_EXCESS_RETURN
```

Definition:

```text
weighted return of basket
minus
return of benchmark
>=
hurdle
```

### Market

- BACK;
- FADE;
- creator automatically starts with BACK exposure through creator bond;
- pari-mutuel pool;
- implied conviction percentage;
- immutable market rules after creation.

### Settlement

- Chainlink-compatible price feeds;
- deterministic weighted return;
- deterministic benchmark comparison;
- settlement window;
- cancel/refund fallback if the oracle cannot settle safely.

### Social layer

- feed;
- thesis detail;
- creator address;
- creator history;
- simple leaderboard based on resolved theses.

### Product states

- draft;
- open;
- betting closed;
- ready to resolve;
- proven;
- failed;
- cancelled.

## 3.2 Explicitly Out of Scope

Do not build these before the main loop is fully working:

- comments;
- DMs;
- notifications;
- follower graph;
- reposts;
- creator tokens;
- thesis memecoins;
- copy trading;
- order book;
- custom AMM;
- secondary trading;
- LP incentives;
- cross-chain;
- ERC-4337;
- account abstraction;
- mobile native app;
- custom wallet;
- complex agent orchestration;
- LangGraph;
- multi-agent workflows;
- Stylus rewrite;
- The Graph;
- database;
- X/Reddit crawling;
- news ingestion;
- portfolio management;
- automated trade execution.

---

# 4. Product Model

## 4.1 Thesis

A thesis is both a social post and a financial contract.

Human-facing representation:

```text
AI IS ROTATING INTO ENERGY

CEG / VST / GEV
vs NVDA

30 days
+10% Narrative Alpha

Creator Conviction
$500

BACK 64%
FADE 36%
```

Machine-facing representation:

```json
{
  "version": 1,
  "narrative": "AI is rotating into nuclear energy.",
  "basket": [
    {"symbol": "CEG", "feed": "0x...", "weight_bps": 4000},
    {"symbol": "VST", "feed": "0x...", "weight_bps": 3500},
    {"symbol": "GEV", "feed": "0x...", "weight_bps": 2500}
  ],
  "benchmark": {
    "symbol": "NVDA",
    "feed": "0x..."
  },
  "hurdle_bps": 1000,
  "betting_ends_at": 0,
  "resolves_at": 0,
  "creator_bond": "500000000"
}
```

## 4.2 Narrative Alpha

For basket assets `i`:

```text
assetReturn_i = endPrice_i / startPrice_i - 1
```

Weighted basket return:

```text
basketReturn = Σ(weight_i × assetReturn_i)
```

Benchmark return:

```text
benchmarkReturn = endBenchmark / startBenchmark - 1
```

Narrative Alpha:

```text
narrativeAlpha = basketReturn - benchmarkReturn
```

Resolution:

```text
if narrativeAlpha >= hurdle:
    BACK wins
else:
    FADE wins
```

## 4.3 Creator Conviction

Every thesis creator must put capital behind the thesis.

The creator bond:

- is mandatory;
- is deposited at thesis creation;
- is counted as BACK stake;
- cannot be withdrawn before resolution;
- wins or loses under the same rules as normal BACK capital.

UI terminology:

```text
Creator Conviction
```

Avoid the word "deposit" in product copy unless legally/technically necessary.

## 4.4 BACK / FADE

Use only:

```text
BACK
FADE
```

Never show:

```text
YES
NO
LONG
SHORT
```

in primary consumer UI.

Meaning:

```text
BACK = I believe this thesis will clear the hurdle.
FADE = I believe it will not.
```

## 4.5 Market Probability

v0.1 uses a pari-mutuel pool.

Do not pretend it is a freely tradable price.

Display:

```text
BACK 64%
FADE 36%
```

Calculation:

```text
backPct = backPool / (backPool + fadePool)
fadePct = 1 - backPct
```

Use wording:

```text
Market conviction
```

Do not use:

```text
Market price
```

for v0.1.

---

# 5. Smart Contract Architecture

## 5.1 Stack

```text
Solidity
Foundry
OpenZeppelin v5
Robinhood Chain Testnet
Chainlink AggregatorV3Interface-compatible feeds
MockERC20 collateral for testnet/demo where required
```

Verify current chain IDs and feed addresses immediately before deployment.

Working chain assumption:

```text
Robinhood Chain Testnet: 46630
Robinhood Chain Mainnet: 4663
```

## 5.2 Contract Tree

```text
contracts/
├── src/
│   ├── ThesisFactory.sol
│   ├── ThesisMarket.sol
│   ├── OracleMath.sol
│   └── MockUSDG.sol
│
├── test/
│   ├── ThesisFactory.t.sol
│   ├── ThesisMarket.t.sol
│   ├── ThesisMarketFuzz.t.sol
│   ├── ThesisMarketInvariant.t.sol
│   └── MockV3Aggregator.sol
│
└── script/
    ├── Deploy.s.sol
    └── CreateDemoMarket.s.sol
```

## 5.3 ThesisFactory Responsibilities

Only:

- validate high-level deployment constraints;
- transfer creator bond;
- deploy thesis market;
- emit market-created event;
- expose deployed market addresses.

Do not put market settlement logic in the factory.

Suggested public surface:

```solidity
function createMarket(
    MarketParams calldata params,
    uint256 creatorBond
) external returns (address market);

function marketsLength() external view returns (uint256);

function marketAt(uint256 index) external view returns (address);
```

## 5.4 MarketParams

Suggested structure:

```solidity
struct BasketAsset {
    address feed;
    uint16 weightBps;
}

struct MarketParams {
    string narrative;

    BasketAsset[] basket;
    address benchmarkFeed;

    int32 hurdleBps;

    uint64 bettingEndsAt;
    uint64 resolvesAt;

    address collateral;
}
```

Constraints:

```text
narrative length <= 280 bytes
basket length: 1–5
sum(weights) = 10,000 bps
benchmarkFeed != 0x0
collateral != 0x0
hurdle: 100–5,000 bps
bettingEndsAt < resolvesAt
resolvesAt must be in future
```

## 5.5 ThesisMarket Responsibilities

Only:

- hold collateral;
- hold immutable thesis specification;
- record start oracle values;
- accept BACK/FADE;
- stop participation at cutoff;
- resolve;
- refund on cancellation;
- allow winners to claim.

Suggested external actions:

```solidity
function back(uint256 amount) external;
function fade(uint256 amount) external;

function resolve() external;
function cancelAfterDeadline() external;

function claim() external;
function refund() external;
```

## 5.6 Outcome

```solidity
enum Outcome {
    Unresolved,
    Back,
    Fade,
    Cancelled
}
```

## 5.7 Events

Events are product data.

Required:

```solidity
event MarketCreated(...);

event PositionTaken(
    address indexed user,
    Side side,
    uint256 amount,
    uint256 backPool,
    uint256 fadePool
);

event MarketResolved(
    Outcome outcome,
    int256 narrativeAlphaBps
);

event MarketCancelled();

event Claimed(
    address indexed user,
    uint256 payout
);
```

Store enough event data to reconstruct:

- creator track record;
- entry timing;
- entry market conviction;
- position size;
- result;
- payout.

## 5.8 Oracle Rules

At market creation:

- read each asset feed;
- read benchmark feed;
- normalize decimals;
- reject invalid price;
- store start prices.

At resolution:

- must be `block.timestamp >= resolvesAt`;
- must be within the allowed settlement window;
- read latest valid price;
- require oracle update to be fresh enough;
- reject zero/negative answer;
- normalize decimals;
- calculate return deterministically.

Recommended v0.1 settlement window:

```text
30 minutes
```

If valid settlement is impossible after the window:

```text
Cancelled
→ all participants may refund principal
```

## 5.9 Oracle Safety

Contract tests must cover:

- zero answer;
- negative answer;
- stale update;
- different feed decimals;
- duplicate basket feed;
- benchmark also present in basket;
- invalid weight sum;
- extreme price movement;
- resolution before expiry;
- resolution after settlement deadline.

## 5.10 Contract Security Rules

Mandatory:

- `SafeERC20`;
- checks-effects-interactions;
- `ReentrancyGuard` on claim/refund if external token transfer exists;
- immutable configuration where possible;
- no upgradeability;
- no proxy;
- no admin ability to change outcome;
- no creator ability to cancel an active market;
- no owner-controlled price;
- no arbitrary call;
- no hidden fee in v0.1.

The protocol should be understandable by reading two contracts.

---

# 6. Backend Architecture

## 6.1 Stack

```text
Python 3.12+
FastAPI
Pydantic v2
httpx
OpenAI-compatible structured-output client
uvicorn
```

No:

- Celery;
- Redis;
- background queue;
- ORM;
- DB.

## 6.2 Backend Purpose

The backend is a **Thesis Compiler service**.

It does not:

- sign user transactions;
- hold wallets;
- hold private keys;
- submit market bets;
- resolve markets;
- custody funds.

## 6.3 API Surface

v0.1:

```http
POST /v1/thesis/compile
GET  /v1/assets
GET  /health
```

Optional:

```http
POST /v1/thesis/validate
```

Do not exceed five public endpoints in v0.1.

## 6.4 Compile Request

```json
{
  "text": "AI is rotating into nuclear energy.",
  "preferred_duration_days": 30
}
```

## 6.5 Compile Response

```json
{
  "version": 1,

  "narrative": "AI is rotating into nuclear energy.",

  "basket": [
    {
      "symbol": "CEG",
      "weight_bps": 4000,
      "feed": "0x..."
    },
    {
      "symbol": "VST",
      "weight_bps": 3500,
      "feed": "0x..."
    },
    {
      "symbol": "GEV",
      "weight_bps": 2500,
      "feed": "0x..."
    }
  ],

  "benchmark": {
    "symbol": "NVDA",
    "feed": "0x..."
  },

  "hurdle_bps": 1000,

  "duration_days": 30,

  "human_condition":
    "CEG/VST/GEV must outperform NVDA by at least 10% over 30 days.",

  "risk": {
    "level": "HIGH",
    "warnings": []
  }
}
```

## 6.6 Pydantic Model

```python
class ThesisAsset(BaseModel):
    symbol: str
    feed: str
    weight_bps: int

class ThesisBenchmark(BaseModel):
    symbol: str
    feed: str

class ThesisRisk(BaseModel):
    level: Literal["LOW", "MEDIUM", "HIGH"]
    warnings: list[str]

class ThesisSpec(BaseModel):
    version: Literal[1]
    narrative: str

    basket: list[ThesisAsset]
    benchmark: ThesisBenchmark

    hurdle_bps: int
    duration_days: int

    human_condition: str
    risk: ThesisRisk
```

## 6.7 Deterministic Validator

Never trust LLM output directly.

Validation order:

```text
LLM output
→ Pydantic parse
→ symbol/feed whitelist
→ basket size
→ weight sum
→ benchmark checks
→ hurdle range
→ expiry range
→ metadata safety checks
→ normalized ThesisSpec
```

Fail closed.

If uncertain:

```text
return a clear validation error
```

Do not auto-correct material financial semantics without showing the user.

## 6.8 LLM Rules

Recommended:

```text
temperature: 0–0.2
structured output / JSON schema: required
single call for v0.1
timeout: 20 seconds
one retry maximum
```

Prompt must state:

- choose only supported assets;
- basket max 5;
- weights total exactly 10,000;
- benchmark must represent the thesis comparison;
- use conservative hurdle;
- never invent feed addresses;
- output only schema fields;
- do not determine market outcome.

Feed addresses come from deterministic backend mapping, not from LLM output.

Better pattern:

```text
LLM returns symbols + weights
backend maps symbols → trusted feed addresses
```

## 6.9 Asset Metadata

Maintain a simple checked-in config:

```text
api/data/assets.json
```

Each asset:

```json
{
  "symbol": "NVDA",
  "name": "NVIDIA",
  "feed": "0x...",
  "enabled": true
}
```

For hackathon:

> Prefer 8–15 high-quality supported assets over trying to support everything.

Suggested demo universe:

```text
GME
AMC
HOOD
COIN
NVDA
PLTR
CEG
VST
GEV
SPY
```

Only include assets whose feed path is verified.

## 6.10 Error Contract

All API errors:

```json
{
  "error": {
    "code": "THESIS_INVALID",
    "message": "The basket weights do not sum to 100%.",
    "retryable": false
  }
}
```

Never return stack traces to frontend.

---

# 7. Frontend Architecture

## 7.1 Stack

Use:

```text
Vite
Vanilla TypeScript
TailwindCSS
viem
native EIP-1193 wallet provider
```

Do not use:

- React;
- Vue;
- Next;
- Zustand;
- Redux;
- wagmi;
- component library;
- routing framework.

## 7.2 Page Strategy

Use Vite multi-page build.

```text
web/
├── index.html
├── create.html
├── market.html
├── profile.html
│
└── src/
    ├── styles.css
    ├── config.ts
    ├── chain.ts
    ├── api.ts
    ├── contracts.ts
    ├── format.ts
    ├── wallet.ts
    ├── events.ts
    │
    ├── components/
    │   ├── AppHeader.ts
    │   ├── WalletButton.ts
    │   ├── ThesisCard.ts
    │   ├── ThesisComposer.ts
    │   ├── ThesisPreview.ts
    │   ├── BackFadeControl.ts
    │   ├── ConvictionBar.ts
    │   ├── MetricRow.ts
    │   ├── MarketStatus.ts
    │   ├── EmptyState.ts
    │   └── Toast.ts
    │
    └── pages/
        ├── feed.ts
        ├── create.ts
        ├── market.ts
        └── profile.ts
```

No router.

Market link:

```text
/market.html?address=0x...
```

Profile:

```text
/profile.html?address=0x...
```

## 7.3 Component Pattern

Every component:

```text
input props
→ returns HTMLElement
```

No global component state.

Example:

```ts
export function ThesisCard(props: ThesisCardProps): HTMLElement
```

For interactions:

- attach local DOM handlers;
- dispatch `CustomEvent` only when cross-component communication is required;
- avoid event bus.

## 7.4 State Rules

Three categories only:

### Server state

AI compile response.

Keep in page-local memory.

### Chain state

Read from RPC / logs.

Always re-read after transaction confirmation.

### UI state

Modal open, input amount, loading status.

Keep local to page/component.

No global state library.

---

# 8. Information Architecture

## 8.1 Top-Level Navigation

Desktop:

```text
Backfade        Feed        Create                    [Wallet]
```

Optional after MVP:

```text
Leaderboard
```

Do not add more than four nav items.

Mobile:

```text
Backfade                                  [Wallet]
```

Bottom nav is not needed for hackathon v0.1.

## 8.2 Feed

Purpose:

> Discover market narratives, not dashboards.

Feed card priority:

1. creator;
2. narrative;
3. machine-verifiable condition;
4. creator conviction;
5. market conviction;
6. BACK/FADE CTA;
7. status / expiry.

Do not show TVL, APY or protocol statistics above thesis content.

## 8.3 Create

Main screen:

```text
What's your thesis?
```

One large input.

After compile:

```text
Narrative
↓
Compiled basket
↓
Benchmark
↓
Hurdle
↓
Duration
↓
Creator Conviction
↓
Launch Thesis
```

The user must explicitly confirm the compiled thesis.

Never auto-submit a market after AI compilation.

## 8.4 Market Detail

Sections in order:

```text
1. Narrative
2. Creator + status
3. BACK / FADE conviction
4. Action controls
5. Narrative Alpha condition
6. Basket / benchmark
7. Current progress
8. Timeline
9. Onchain details
```

Do not lead with contract address.

## 8.5 Profile

v0.1 profile:

```text
wallet/address
resolved thesis count
proven
failed
capital bonded
simple hit rate
created theses
positions
```

Do not invent a proprietary score until sufficient history exists.

For the demo, a basic:

```text
Proof Rate
```

is enough.

---

# 9. Brand System

## 9.1 Brand Personality

Backfade should feel:

- sharp;
- intelligent;
- market-native;
- confident;
- restrained;
- technical without looking like developer tooling;
- social without looking playful;
- crypto-native without neon cyberpunk clichés.

Do not feel:

- casino;
- Robinhood clone;
- memecoin casino;
- enterprise SaaS;
- AI dashboard;
- gaming UI.

## 9.2 Wordmark

v0.1 logo:

```text
backfade
```

Rules:

- lowercase;
- text-only;
- weight 700;
- no icon required;
- no gradient;
- no 3D;
- no mascot;
- no custom decorative letterforms.

Logo is not the problem to solve during the hackathon.

## 9.3 Color Palette

Dark mode only for v0.1.

### Core

```css
--canvas:        #0B0D0E;
--surface-1:     #111416;
--surface-2:     #171B1E;
--surface-3:     #1D2226;

--border:        #272D31;
--border-strong: #353D42;

--text-1:        #F4F7F5;
--text-2:        #A4ADA8;
--text-3:        #727C76;
```

### Brand

```css
--brand:         #CFFF63;
--brand-hover:   #DBFF86;
--brand-pressed: #B8EA49;
--brand-on:      #10130A;
```

Brand meaning:

> conviction / active / signal.

Use brand color sparingly.

Maximum visual rule:

> no more than ~10% of the visible screen should be brand green.

### Semantic

```css
--back:          #9BE879;
--back-soft:     #1B2B1C;

--fade:          #FF756F;
--fade-soft:     #2F1C1D;

--warning:       #F4C95D;
--warning-soft:  #2C2617;

--info:          #75B7FF;
--info-soft:     #172536;
```

Do not use saturated exchange-style bright green/red everywhere.

## 9.4 Color Usage

Brand green:

- primary CTA;
- logo micro-accent if needed;
- selected navigation;
- important active indicator.

BACK green:

- BACK label;
- positive outcome;
- BACK side of market conviction bar.

FADE red:

- FADE label;
- negative outcome;
- FADE side.

Do not use brand green as BACK green if both appear on the same component.

## 9.5 Typography

No mandatory external font in v0.1.

Primary stack:

```css
font-family:
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Numeric / addresses:

```css
font-family:
  ui-monospace,
  SFMono-Regular,
  Menlo,
  Monaco,
  Consolas,
  monospace;
```

Type scale:

```text
12px / 16px  metadata
13px / 18px  secondary
14px / 20px  body small
16px / 24px  body
18px / 26px  card title
24px / 32px  section title
32px / 38px  page title
48px / 52px  landing hero max
```

Weights:

```text
400 body
500 controls
600 labels / card titles
700 brand / primary headline
```

Do not use 800/900 except temporary marketing hero experiments.

## 9.6 Spacing

Use a strict 4px base.

Allowed scale:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Default component internal padding:

```text
small: 12
normal: 16
large: 24
```

Page vertical rhythm:

```text
mobile: 24
desktop: 32–48
```

Do not invent one-off values like 13px, 22px, 27px.

## 9.7 Radius

```text
6px   small chip / tiny control
8px   input / secondary button
10px  primary button
12px  card
16px  modal / large panel
999px only for true pill tags
```

Do not make every rectangle a 24px rounded "AI card".

## 9.8 Borders

Default:

```text
1px solid var(--border)
```

Selected / active:

```text
1px solid var(--border-strong)
```

Avoid box-shadow-heavy cards.

Most elevation should come from:

- surface contrast;
- border contrast;
- spacing.

## 9.9 Shadows

Only:

```css
--shadow-popover:
  0 16px 48px rgba(0,0,0,.35);
```

Use for:

- modal;
- wallet popover;
- toast stack.

Never use shadows on every feed card.

---

# 10. Layout System

## 10.1 Page Width

Desktop:

```text
max-width: 1180px
horizontal padding: 24px
```

Primary feed column:

```text
680–720px
```

Optional right rail:

```text
300–320px
```

Create page:

```text
max-width: 760px
```

Market detail:

```text
max-width: 900px
```

## 10.2 Breakpoints

Use only three practical states:

```text
< 640px    mobile
640–1024   tablet
> 1024px   desktop
```

No fine-grained breakpoint maze.

## 10.3 Mobile

On mobile:

- single column;
- 16px page padding;
- buttons minimum 44px height;
- BACK and FADE remain side-by-side if >= 360px width;
- otherwise stack;
- wallet address becomes icon/short text;
- never horizontal-scroll thesis details.

---

# 11. Component Design Specifications

## 11.1 AppHeader

Height:

```text
64px desktop
56px mobile
```

Contains:

- `backfade`;
- Feed;
- Create;
- wallet button.

Behavior:

- sticky;
- `backdrop-filter` optional but subtle;
- 1px bottom border;
- no oversized nav.

## 11.2 WalletButton

Disconnected:

```text
Connect wallet
```

Connected:

```text
0x12a4…9eF2
```

States:

- default;
- hover;
- connecting;
- wrong network;
- connected.

Wrong network:

```text
Switch network
```

Do not silently request chain switch repeatedly.

## 11.3 ThesisCard

Card anatomy:

```text
creator • time • status

NARRATIVE TITLE

one-line machine condition

Creator Conviction $500

BACK 64%                    FADE 36%
[ conviction bar ]

$28.4k total conviction • 2d 14h left

[ BACK ] [ FADE ]
```

Rules:

- narrative: max 2 lines;
- machine condition: max 2 lines;
- no more than one chart-like visual;
- no avatar required in v0.1;
- card itself links to detail;
- CTA click must not trigger card navigation.

Padding:

```text
20px desktop
16px mobile
```

Gap between major groups:

```text
16px
```

## 11.4 ConvictionBar

Height:

```text
8px
```

Radius:

```text
999px
```

Shows:

- BACK share;
- FADE share.

No animation longer than 250ms.

Do not use gradients.

## 11.5 BACK / FADE Buttons

Equal visual weight.

BACK:

- neutral dark default;
- green border/text;
- filled green only when selected.

FADE:

- neutral dark default;
- red border/text;
- filled red only when selected.

Never make BACK the default primary action.

The product must remain neutral.

## 11.6 ThesisComposer

Initial state:

```text
What's your thesis?
```

Textarea:

- min-height 140px;
- max 280 chars;
- live character count after 220 chars;
- Enter inserts newline;
- Cmd/Ctrl + Enter submits compile.

Primary CTA:

```text
Compile thesis
```

Loading copy:

```text
Structuring your thesis…
```

Avoid:

```text
AI is thinking…
```

## 11.7 ThesisPreview

After compile, show:

```text
Narrative

Basket
CEG 40%
VST 35%
GEV 25%

Benchmark
NVDA

Narrative Alpha target
+10%

Window
30 days

Risk
HIGH
```

Each financial field must be visually inspectable before launch.

Allow:

```text
Edit
Recompile
```

Do not permit hidden automatic changes after confirmation.

## 11.8 Creator Conviction Input

Label:

```text
Your conviction
```

Helper:

```text
This capital backs your thesis and follows the same market outcome.
```

Presets:

```text
$25
$100
$500
Custom
```

For testnet demo, values may use mock collateral units.

## 11.9 MarketStatus

Allowed:

```text
OPEN
CLOSED
READY
PROVEN
FAILED
CANCELLED
```

Style as a small pill.

Do not use extra variants.

## 11.10 Toast

Use for:

- transaction submitted;
- confirmed;
- compile error;
- wallet/network issue;
- claim success.

Width:

```text
320–380px
```

Duration:

```text
success 4s
info 5s
error sticky until dismissed or 8s
```

Never communicate transaction failure only through button text.

---

# 12. Interaction Design

## 12.1 Motion

Allowed duration:

```text
120ms
160ms
200ms
240ms max
```

Easing:

```css
cubic-bezier(.2,.8,.2,1)
```

No:

- spring bounce;
- floating particles;
- parallax;
- 3D tilt;
- constant pulsing;
- animated gradients.

## 12.2 Button States

Every button:

```text
default
hover
active
focus-visible
disabled
loading
```

Loading must preserve button width.

## 12.3 Transaction Flow

For BACK / FADE:

```text
1. User enters amount.
2. Frontend validates positive amount.
3. Check wallet.
4. Check chain.
5. Check allowance.
6. Request approval if needed.
7. Wait for approval confirmation.
8. Submit market action.
9. Show tx submitted.
10. Wait for receipt.
11. Re-read market state.
12. Show confirmed.
```

Never optimistically show a financial position as final before receipt confirmation.

## 12.4 Create Flow

```text
Narrative input
→ Compile
→ Preview
→ Edit/Confirm
→ Enter conviction
→ Wallet approval
→ Create market
→ Transaction receipt
→ Redirect to market detail
```

## 12.5 Error Recovery

Error text format:

```text
What happened.
What the user can do next.
```

Example:

```text
This oracle update is stale.
Try resolving again after a new price update.
```

Avoid raw RPC errors.

---

# 13. Copywriting Rules

## 13.1 Tone

Use:

- short;
- direct;
- market-native;
- factual;
- calm.

Avoid:

- hype;
- "revolutionary";
- "game-changing";
- "powered by AI" everywhere;
- emojis in core controls;
- casino language.

## 13.2 Preferred Terms

Use:

```text
Thesis
Narrative
Conviction
BACK
FADE
Narrative Alpha
Proven
Failed
Resolve
Claim
```

Avoid:

```text
Bet
Gamble
Win big
AI magic
Predict anything
Tokenized stocks
```

When referring to Robinhood assets, prefer the ecosystem's official term:

```text
Stock Tokens
```

## 13.3 Empty-State Copy

Feed:

```text
No theses yet.
Post the first market take.
```

Profile:

```text
No resolved theses yet.
Track record starts after the first resolution.
```

---

# 14. Accessibility

Minimum:

- WCAG AA text contrast;
- visible `:focus-visible`;
- keyboard usable;
- button hit target >= 44px on mobile;
- form fields have actual labels;
- status does not rely on color alone;
- BACK/FADE include text, not just red/green;
- `aria-live` for transaction state;
- modal traps focus;
- Escape closes dismissible modal.

Respect:

```css
prefers-reduced-motion
```

---

# 15. Performance Constraints

Targets:

```text
initial JS < 180KB gzip if practical
no charting library in v0.1
no animation library
no icon library if <= 10 icons
```

Use inline SVG icons.

Frontend should render useful content before wallet connection.

RPC reads:

- batch where simple;
- cache static feed metadata in memory;
- avoid polling faster than every 10s;
- stop polling when tab hidden where practical.

---

# 16. Security / Trust UX

## 16.1 User Must Always See

Before creating a thesis:

- basket;
- weights;
- benchmark;
- hurdle;
- expiry;
- creator conviction.

Before BACK/FADE:

- side;
- amount;
- market state;
- approximate pool share;
- irreversible nature after submission.

## 16.2 Never Hide

- testnet status;
- mock collateral status;
- market cancellation conditions;
- oracle settlement rule.

## 16.3 Demo Honesty

If mock collateral is used:

```text
Testnet collateral
```

If mock oracle is used for a test-only scenario:

```text
Demo oracle
```

Do not present a mock integration as production live data.

---

# 17. Testing Goal

## 17.1 Contract Unit Tests

Minimum categories:

```text
creation
creator bond
BACK
FADE
betting cutoff
resolution
claims
refunds
oracle errors
weight math
decimals
edge conditions
```

Suggested minimum before submission:

```text
30+ deterministic unit tests
```

## 17.2 Fuzz Tests

At minimum:

```text
random BACK/FADE deposits
random valid weights
random positive oracle prices
random claim order
```

## 17.3 Invariants

At least:

```text
total paid + remaining collateral <= total deposited

winner payout never exceeds market pool

a user cannot claim twice

cancelled market cannot resolve

resolved market cannot cancel
```

## 17.4 Frontend Tests

Do not build a huge E2E suite.

Minimum:

- compile flow smoke test;
- create flow manual checklist;
- wrong network;
- rejected signature;
- failed approval;
- confirmed BACK;
- confirmed FADE;
- resolve;
- claim.

---

# 18. Repository Rules

Root:

```text
backfade/
├── contracts/
├── api/
├── web/
├── docs/
├── README.md
├── GOAL.md
├── Makefile
└── .env.example
```

## 18.1 Naming

Solidity:

```text
PascalCase contracts
camelCase functions
UPPER_CASE constants
```

Python:

```text
snake_case
Pydantic models PascalCase
```

TypeScript:

```text
camelCase values/functions
PascalCase types/components
SCREAMING_SNAKE_CASE only true constants
```

## 18.2 File Size

Guideline:

```text
< 300 lines normal
< 500 lines absolute warning
```

If a file exceeds this because it mixes responsibilities, split it.

Do not split purely to satisfy line count.

## 18.3 Comments

Comment:

- why;
- invariants;
- financial assumptions;
- non-obvious oracle semantics.

Do not comment obvious syntax.

---

# 19. Environment / Config

## 19.1 API `.env`

```text
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=

ROBINHOOD_API_BASE=

CORS_ORIGINS=https://backfade.fun,http://localhost:5173
```

## 19.2 Web `.env`

```text
VITE_CHAIN_ID=46630
VITE_RPC_URL=
VITE_FACTORY_ADDRESS=
VITE_COLLATERAL_ADDRESS=
VITE_API_BASE_URL=
```

No private key in frontend.

## 19.3 Contracts `.env`

```text
RPC_URL=
DEPLOYER_PRIVATE_KEY=
BLOCK_EXPLORER_API_KEY=
```

Use a hackathon-only deployer wallet.

Never reuse a personal high-value wallet.

---

# 20. Deployment

## 20.1 Web

`backfade.fun`

Recommended:

```text
Cloudflare Pages / Vercel static deployment
```

No SSR requirement.

## 20.2 API

Any simple Python host:

```text
Railway / Render / Fly / VPS
```

Only requirement:

- HTTPS;
- stable URL;
- low deployment friction.

## 20.3 Contracts

Deploy:

```text
Robinhood Chain Testnet
```

README must include:

- chain;
- chain ID;
- deployed factory;
- collateral;
- explorer links;
- demo markets.

---

# 21. README Structure

README must begin with product, not setup.

Order:

```text
1. Backfade
2. One-sentence pitch
3. Why
4. Demo
5. How it works
6. Innovation
7. Architecture
8. Smart contracts
9. Robinhood Chain integration
10. Local development
11. Deployment addresses
12. Testing
13. Roadmap
```

Do not begin with:

```text
npm install
```

---

# 22. Hackathon Pitch

## 22.1 One Sentence

> **Backfade turns market narratives into bonded, benchmarked and verifiable onchain theses.**

## 22.2 Problem

> Anyone can post a market take. Very few people can prove they were early, right, and willing to risk capital.

## 22.3 Core Insight

> Markets trade assets, but communities trade narratives.

## 22.4 Mechanism

> AI compiles a narrative into a measurable financial claim; the creator bonds capital; the market BACKs or FADEs it; Stock Token price feeds determine whether the narrative generated alpha.

## 22.5 Why Robinhood Chain

Use Stock Tokens as the natural bridge between:

```text
social market narratives
and
verifiable real-world financial performance
```

## 22.6 Do Not Pitch As

```text
AI prediction market
decentralized Polymarket
SocialFi app
meme stock betting
```

---

# 23. Demo Script

Target:

```text
90–150 seconds
```

## Scene 1 — Create

Enter:

```text
AI is rotating into nuclear.
```

Show compiled thesis:

```text
CEG 40%
VST 35%
GEV 25%

vs NVDA

+10% alpha
30 days
```

For live demo, use a short demo expiry where safe.

## Scene 2 — Bond

Creator:

```text
Creator Conviction: 100 demo USDG
```

Launch.

Show confirmed transaction.

## Scene 3 — BACK / FADE

Second wallet:

```text
FADE 50
```

Show:

```text
BACK 67%
FADE 33%
```

## Scene 4 — Resolve

Show oracle-backed values.

Display:

```text
Narrative Alpha
+12.4%

Hurdle
+10%
```

Result:

```text
THESIS PROVEN
```

## Scene 5 — Reputation

Creator profile:

```text
Resolved 1
Proven 1
Capital Bonded 100
```

End with:

> **Back the thesis. Fade the noise.**

---

# 24. Seven-Day Execution Plan

## Day 1 — Financial Core

Deliver:

- Foundry repo;
- `ThesisMarket`;
- `back`;
- `fade`;
- creator bond;
- collateral accounting;
- unit tests.

Done means:

```text
two users can fund both sides correctly
```

## Day 2 — Narrative Alpha

Deliver:

- basket struct;
- start price capture;
- weighted return math;
- benchmark return;
- hurdle resolution;
- mock aggregator tests.

Done means:

```text
basket vs benchmark resolves deterministically
```

## Day 3 — Factory + Safety

Deliver:

- factory;
- market creation;
- validation;
- settlement window;
- cancel/refund;
- fuzz/invariant tests.

Done means:

```text
contract layer is independently demoable
```

## Day 4 — Thesis Compiler

Deliver:

- FastAPI;
- schema;
- one structured LLM call;
- deterministic validator;
- supported assets config.

Done means:

```text
"AI is rotating into nuclear"
→ valid ThesisSpec
```

## Day 5 — Web

Deliver:

- feed;
- create;
- market detail;
- wallet;
- BACK/FADE;
- transaction states.

Done means:

```text
browser → wallet → contract loop works
```

## Day 6 — Social Proof

Deliver:

- profile;
- event-based created markets;
- resolved count;
- proven/failed;
- simple leaderboard;
- UI polish.

Done means:

```text
a creator has a visible onchain track record
```

## Day 7 — Submission Quality

Deliver:

- deploy clean testnet version;
- verify contracts;
- full README;
- architecture diagram;
- demo video;
- screenshots;
- bug fixes;
- final pitch.

No new features.

---

# 25. Definition of Done

v0.1 is done only when all are true:

```text
[ ] User can write a thesis in natural language.
[ ] Compiler returns a valid basket + benchmark + hurdle.
[ ] User can inspect and confirm the structure.
[ ] Creator must bond capital.
[ ] Market deploys on Robinhood Chain Testnet.
[ ] Another wallet can BACK.
[ ] Another wallet can FADE.
[ ] Pool conviction updates.
[ ] Oracle math can settle weighted basket vs benchmark.
[ ] Winner can claim.
[ ] Cancelled market can refund.
[ ] Creator history can be reconstructed from events.
[ ] Feed renders markets without a custom database.
[ ] Profile renders basic resolved performance.
[ ] Wrong network is handled.
[ ] Rejected transaction is handled.
[ ] Contract tests pass.
[ ] Fuzz tests pass.
[ ] Invariants pass.
[ ] Demo completes in under 150 seconds.
[ ] README explains the innovation before implementation details.
[ ] backfade.fun points to the working product.
```

---

# 26. Kill Criteria

If behind schedule, cut in this order:

```text
1. leaderboard
2. profile styling
3. live Robinhood metadata warnings
4. multiple thesis templates
5. long AI rationale
6. right-side desktop rail
```

Never cut:

```text
creator bond
BACK / FADE
Narrative Alpha
deterministic settlement
claim/refund
full lifecycle demo
```

---

# 27. Post-Hackathon Roadmap

Only after v0.1 is submitted.

## V0.2

- better creator reputation;
- entry-time conviction score;
- proper scoring;
- richer feed;
- verified names/ENS where practical;
- dedicated indexer.

## V0.3

- secondary trading;
- outcome tokens;
- custom AMM or order book;
- creator follows;
- alerts.

## V1

- AI creators;
- human vs agent leaderboards;
- external narrative discovery;
- other RWA verticals;
- protocol SDK;
- third-party thesis creation;
- agent execution adapters.

Potential long-term identity:

> **The market and reputation layer for investment narratives.**

---

# 28. Final Constraints Summary

If any implementation decision is ambiguous, choose the option that best preserves these rules:

```text
1. One product object: Thesis.
2. One core metric: Narrative Alpha.
3. One social commitment: Creator Conviction.
4. Two actions: BACK / FADE.
5. AI compiles; oracles resolve.
6. Chain stores financial truth.
7. No database in v0.1.
8. No microservices.
9. No framework-heavy frontend.
10. No feature that delays the full lifecycle.
11. Dark, restrained, high-signal visual language.
12. Financial state must always be explicit.
13. No hidden automation of user money.
14. No admin outcome control.
15. Ship the complete loop before expanding the story.
```

---

# 29. Final Product Definition

**Backfade** is a social market for investment narratives.

A creator posts a thesis, bonds capital behind it, and allows the market to BACK or FADE the idea. The thesis is compiled into a benchmarked financial claim and resolved deterministically using onchain price data. Every resolved thesis becomes part of a permanent financial track record.

The UI looks social.

The mechanism behaves like a market.

The protocol produces proof.

> **Back the thesis. Fade the noise.**
