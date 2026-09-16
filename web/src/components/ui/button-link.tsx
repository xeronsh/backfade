import type { VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ButtonLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  to: string;
}

/**
 * A link that looks like a Button — one focus ring, one hover, one disabled
 * treatment. Never nest `<Link><Button/></Link>`; that produces two tab stops.
 */
export function ButtonLink({
  className,
  to,
  variant,
  size,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
