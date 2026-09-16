import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge cannot infer custom theme tokens. Without this config it sees
 * `text-brand-on` (a colour) and `text-meta` (a font size) as the same group
 * and drops the earlier one, which silently removed the button text colour and
 * the whole type scale. Teach it which of our tokens are sizes and which are
 * colours, then `cn` merges correctly.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // `--text-*` tokens that set font-size (and line-height).
      text: ["page-title", "narrative", "body", "meta"],
      // `--color-*` tokens used with text-*.
      color: [
        "canvas",
        "surface-1",
        "surface-2",
        "surface-3",
        "border",
        "border-strong",
        "text-1",
        "text-2",
        "text-3",
        "brand",
        "brand-hover",
        "brand-pressed",
        "brand-on",
        "back",
        "back-soft",
        "fade",
        "fade-soft",
        "warning",
        "info",
      ],
      radius: ["micro", "chip", "field", "button", "card", "panel", "full"],
      shadow: ["popover"],
      font: ["sans", "mono"],
      tracking: ["label", "eyebrow"],
      container: ["page"],
      ease: ["standard", "enter", "exit"],
      animate: ["spin", "pulse"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
