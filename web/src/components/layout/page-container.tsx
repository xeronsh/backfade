import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** The only page-level width and gutter in the product. */
export function PageContainer({
  className,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-page px-5 pt-14 pb-24 sm:px-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
