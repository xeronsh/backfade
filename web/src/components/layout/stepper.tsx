import { cn } from "@/lib/utils";

/**
 * A numbered progress list: thesis launch steps, onboarding, any ordered
 * walkthrough. One definition, so no route re-styles a numbered rail.
 */
export function Stepper({
  steps,
  className,
  label,
}: {
  steps: string[];
  className?: string;
  label?: string;
}) {
  return (
    <ol className={cn("grid gap-3", className)} aria-label={label}>
      {steps.map((step, index) => (
        <li
          key={step}
          className="flex items-center gap-3 font-mono text-meta uppercase tracking-label text-text-3"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-full border border-border-strong text-brand"
          >
            {`0${index + 1}`}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}
