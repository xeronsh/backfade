# Pitch notes

Working notes for answering questions about Backfade. Not part of the repository's
documentation set — the evaluator-facing page is [`SUBMISSION.md`](SUBMISSION.md).

## Six questions

**1. Why is this not Polymarket?**

Polymarket prices *event probability* — will X happen, yes or no. Backfade prices whether an
**investment narrative generates benchmark-relative alpha**. The traded object is not an event
outcome; it is whether a basket outperforms a benchmark by a required margin.

**2. Why does the Creator Bond exist?**

It turns a free market opinion into a **costly signal**. Posting a take costs nothing and can be
deleted. Bonding capital means the creator is exposed to being wrong.

**3. Why is this not just an index builder?**

The basket is only the **machine representation** of a narrative. The traded object is the thesis
and its alpha against a benchmark, with a hurdle and a settlement deadline. An index has no
counterparty, no hurdle, and no resolution.

**4. Why Robinhood Chain?**

Because Backfade turns real-world stock narratives into onchain claims and resolves them using
market-linked price infrastructure. Robinhood Chain's Stock Token direction supplies that
environment, so a narrative about real equities becomes a claim the chain can settle.

**5. Where is the AI?**

AI **compiles** a human narrative into a restricted, deterministic `ThesisSpec` (basket, weights,
benchmark, hurdle, duration) under a fail-closed validator. AI **never** determines settlement, and
it cannot supply feed addresses — those come from a deterministic registry. The oracle and the
math decide the winner.

**6. Why should this be trusted?**

Capital, specification, oracle settlement, and payout all live onchain. There is no proxy, no
upgradeability, no owner, no admin settlement, and no database. Anyone can call `resolve()`; the
math decides. Both documentation and the published evidence record the protocol's limits rather
than hiding them.

---
