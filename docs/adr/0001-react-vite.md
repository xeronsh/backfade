# ADR 0001: React + Vite

## Decision

Use React, Vite, strict TypeScript, and Tailwind CSS v4 for the static web app.

## Why

Backfade needs cohesive route composition and reusable domain UI without introducing SSR, a BFF,
Next.js, or server components. Vite keeps the deployment a single static origin and preserves the
existing tunnel model.
