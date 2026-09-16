import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { reveal, revealTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/**
 * Entrance motion. Duration and easing come from `lib/motion.ts`, never from
 * the call site.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return <div className={cn(className)}>{children}</div>;

  return (
    <motion.div
      className={cn(className)}
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      transition={{ ...revealTransition, delay }}
    >
      {children}
    </motion.div>
  );
}
