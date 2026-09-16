import type { Transition, Variants } from "motion/react";

type Cubic = [number, number, number, number];

/** Mirrors the 120/160/220/280ms tokens in DESIGN_SYSTEM.md and Tailwind `duration-*`. */
export const duration = {
  instant: 0.12,
  fast: 0.16,
  base: 0.22,
  slow: 0.28,
} as const;

/**
 * The CSS side of the same four values, in the exact names Tailwind exposes
 * (`duration-fast` -> `--transition-duration-fast`). `motion.test.ts` asserts
 * these agree with `duration`, so the two tables cannot drift apart.
 */
export const cssDuration = {
  fast: "120ms",
  standard: "160ms",
  slow: "220ms",
  emphasis: "280ms",
} as const;

/** Maps a JS duration token onto its CSS utility class. */
export const durationClass = {
  instant: "duration-fast",
  fast: "duration-standard",
  base: "duration-slow",
  slow: "duration-emphasis",
} as const;

export const ease: Record<"standard" | "enter" | "exit", Cubic> = {
  standard: [0.2, 0.8, 0.2, 1],
  enter: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
};

function transition(seconds: number, curve: Cubic): Transition {
  return { duration: seconds, ease: curve };
}

/**
 * Backfade motion language: Reveal -> Shift -> Lock -> Confirm.
 * Routes import these variants; they never inline their own duration or easing.
 */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

/** Disclosure open/close. Pairs with the Collapsible primitive. */
export const collapse: Variants = {
  open: { height: "auto", opacity: 1 },
  closed: { height: 0, opacity: 0 },
};

export const collapseTransition = transition(duration.fast, ease.standard);

export const revealTransition = transition(duration.slow, ease.enter);

export const shift: Variants = {
  idle: { x: 0 },
  moved: { x: 3 },
};

export const shiftTransition = transition(duration.fast, ease.standard);

export const lock: Variants = {
  unlocked: { scale: 1 },
  locked: { scale: 0.98 },
};

export const lockTransition = transition(duration.base, ease.standard);

export const confirm: Variants = {
  pending: { opacity: 0.6 },
  confirmed: { opacity: 1 },
};

export const confirmTransition = transition(duration.fast, ease.exit);

/**
 * Entrance delays. Routes name a slot instead of writing a literal, so the
 * cadence of a list stays a design decision rather than a per-page guess.
 */
export const stagger = {
  /** Gap between siblings in a list. */
  step: 0.06,
  /** Ceiling for a long list, so the last card is not delayed for seconds. */
  max: 0.24,
  /** A single panel that follows the main column. */
  panel: 0.08,
  /** A sidebar that should trail the main column. */
  aside: 0.14,
  /** A standalone block near the top of a page. */
  lead: 0.06,
} as const;

/** Staggered delay for the nth sibling, capped by `stagger.max`. */
export function staggerDelay(index: number) {
  return Math.min(index * stagger.step, stagger.max);
}
