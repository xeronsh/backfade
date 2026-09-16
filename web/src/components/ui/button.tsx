import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-button border px-4 text-body font-medium transition-[color,background-color,border-color,transform] duration-slow disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border-strong bg-surface-2 text-text-1 hover:bg-surface-3",
        primary:
          "border-brand bg-brand text-brand-on hover:bg-brand-hover active:bg-brand-pressed",
        ghost:
          "border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text-1",
        back: "border-back bg-transparent text-back hover:bg-back-soft",
        fade: "border-fade bg-transparent text-fade hover:bg-fade-soft",
        danger: "border-fade bg-fade-soft text-fade hover:bg-fade",
      },
      size: {
        default: "",
        sm: "min-h-9 px-3 text-meta",
        lg: "min-h-12 px-5 text-body",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
}

export { buttonVariants };
