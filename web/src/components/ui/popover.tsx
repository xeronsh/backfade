import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Popover = BasePopover;

export function PopoverContent({
  className,
  ...props
}: ComponentProps<typeof BasePopover.Popup>) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner sideOffset={8}>
        <BasePopover.Popup
          className={cn(
            "z-50 rounded-card border border-border-strong bg-surface-2 p-3 shadow-popover",
            className,
          )}
          {...props}
        />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
